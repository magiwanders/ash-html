/*
`ash-sim` is an event-based simulation engine fully contained within a worker, and that can therefore be easily instantiated multiple times within a single webpage. 

> Each simulator worker contains a single functional block and the necessary logic to handle an event-based-like propagation of signals between the sub-components of the functional block, which are functional blocks themselves.

## Abstractions

### Functional Block
The functional block is made of four objects:
- **List of Inputs** - An input is a block with only one output. At the top level of the simulation it is the only gateway with which the website hosting the simulator worker can communicate with the simulated netlist inside the worker.
- **List of Outputs** - An output is a block with only one input. It is the only gateway with which the simulated netlist can communicate back to the hosting website.
- **Netlist of Sub-component Functional Blocks** - The list of sub-component functional blocks and a description of the connections between them. The connections are described, for each output, as the list of inputs "listening" to it.
- **Specification** - A JavaScript function that implements the specification behaviour, which is the target behaviour of the netlist of sub-components.

> The only functional block that have a specification but have no netlist of sub-components are the universal gates, _nand_ and _nor_. 

### Propagation
Each time the host website modifies an input in a given simulator worker, the simulator propagates the new value to the functional block inputs connected to it. These blocks re-calculate the output, and if it changes the block inputs connected to it are notified with the new value, and so on until the whole netlist has been propagated down to the global outputs.

## Implementation
Each worker contains the following variables:
- `supportedBlocks` - A list of supported functional simulation blocks. This is where the simulator gets information on how to simulate each block, and therefore there should be a function that makes sure that all blocks mentioned as subcomponents are also present as first level components, since they are not fully described, but only connections are specified. The description of blocks contained here is ideally directly compiled from an HDL. 
```
supportedBlocks = {
    <name_of_functional_block>: {
        ins: [ 'a', 'b' ]
        outs: [ 'out' ]
        blocks: {
            <name_of_block>: {
                <in1>: <a>,
                <in2>: <b>,
                <out>: <c>
            },
            <another_block>: {
                <in1>: <b>,
                <in2>: <c>,
                <out>: <out>
            }
        }
        spec: ({a=0, b=0}) => { 
            return {out: f(a, b)}
        }
    },
    <name_of_another_block>: { ... }
}

```
- `connections` - Contains for each output its value and the list of listening inputs. The only inputs to have a value are the global output blocks. Note that here the sub-component blocks need labels of the form `<block>_<progressiveNumber>` in order to be individually referenced as listeners.
```
connections = {
    <in1>: {
        value: 0,
        listeners: [ label:port, label:port, ...]
    },
    ...
    <out1>: {value: 0},
    ...
    <block:out1>: {         
        value: 0,
        listeners: [label:port, label:port, ...]
    }, 
    ...
}
```

*/

// #region Header

const LOW = 0
const HIGH = 1

/*
{
    <block>: {
        ins: {a:0, b:0}
        outs: {out:0}
    }
}
*/
let blockInterfaces = {}

let blockSpecs = {}

let blockConnections = {}

// #endregion


// #region Functions

// Reset the whole simulator
function resetAll() {
    supportedBlocks = {}
    resetSim()
}

// Reset only the simulated netlist structure
function resetSim() {
    simulatedBlock = {}
}

// Adds a component to the simulation with progressive label.
function addComponent({component='<component>', type='<gate>', label=''}) {
    if (label=='') label = type+'_'+ Object.keys(simulatedBlock[what+'s']).length
    switch (component) {
        case 'in': if (simulatedBlock.ins[label]==undefined) simulatedBlock.ins[label].value = LOW; break;
        case 'out': if (simulatedBlock.outs[label]==undefined) structure.outs[label] = LOW; break;
        case 'block': if (structure.chips[label]==undefined) for(let i in supportedChips[type].structure.outs) structure.chips[label][i].value = LOW; break;
        default: break;
    }
}

// Adds the input "to" to the listeners of output "from". 
// TODO Since each input can listen to only one ouput, if the input was already conected, only the new connection is maintained.
function connect({from='<label>:<out>', to='<label>:<in>'}) { 
    // Deletes connection if 'to' is already connected
    for (let component of ['ins', 'outs', 'blocks']) for (let componentInstance of Object.keys(simulatedBlock.component)) for (let listener of componentInstance.listeners) if (inputPort==listener) delete simulatedBlock.component[componentInstance].listeners[listener]

    let [from, to] = splitLabelPorts(from, to)

    simulatedBlock[from.component][from.label][l.port].push(to)
    set({label: to, value: l.value})
}

// Disconnect input <to> from the output it is connected to and sets the input back to zero.
// Removes the input "to" from the list of listeners of the ouput it is currently listening to.
function disconnect({to}) {
    for (output of Object.keys(connections)) {
        let to_i = output.indexOf(to)
        if (to_i!=-1) connections[output].splice(to_i, 1)
    }
    set({label: to, value: LOW})
}

// Propagates new value of output <from> to all the listening inputs.
function propagate({from, value}) {
    if (connections[from]!=undefined) {
        for (to of connections[from]) {
            console.log('[Scheduler] '+from+' ===== dispatching value '+value+' ====> '+to)
            set({label: to, value: value}) 
        }
    }
}

// Sets to either LOW  or HIGH an input, an input, output or the inputs of a chip. Users should only set global inputs and not chip inputs or global outputs.
function set({label, value, checkIfAlreadySameValueOverride}) {
    console.log("[Simulator] setting:", label, value, checkIfAlreadySameValueOverride==true)
    let l = splitLabelPort(label)
    if (
        Object.keys(inList).includes(label) && 
        inList[label] != undefined && 
        (inList[label] != value | checkIfAlreadySameValueOverride==true)
        ) {
            inList[label] = value
            propagate({from: label, value: value})
    } else if (
        Object.keys(outList).includes(label)  && 
        outList[label] != undefined && 
        (outList[label] != value | checkIfAlreadySameValueOverride==true)
        ) {
            outList[label] = value
            outChanged({label: label, value: value})
    } else if (
        Object.keys(blockList).includes(l.chip)  && 
        blockList[l.chip]!=undefined &&
        (blockList[l.chip].ins[l.port]!= value | checkIfAlreadySameValueOverride==true)
        ) {
            blockList[l.chip].ins[l.port] = value
            newOut = supportedChips[l.spec].spec(blockList[l.chip].ins.a, blockList[l.chip].ins.b)
            if (blockList[l.chip].outs.out != newOut) {
                console.log("Internal out changed: ", l.chip, "to", newOut)
                blockList[l.chip].outs.out = newOut
                propagate({from: l.chip+':out', value: newOut})
            }
    }
}

// // Prints the current state of ins, outs, components and connections.
function probe({id}) {
    console.log(inList)
    console.log(outList)
    console.log(blockList)
    console.log(supportedChips)
    console.log(connections)
}

// #endregion


// #region Utility

// Convenience function to make the change of a global output appear in console.
function outChanged({label, value}) {
    console.log("Global output ", label, ' ---------- changed to ---------> ', value)
}

// Returns a data structure containing the type, label, port and port value of a given <label>:<port> that is <type>_<progressiveNumber>:<port> string.
function splitLabelPort(labelPort) {
    let info =  {
        label: labelPort.substring(0, labelPort.indexOf(':')),
        port:  labelPort.substring(labelPort.indexOf(':')+1, labelPort.length), 
        value: 0,
        type: label.substring(0, labelPort.indexOf('_')),
        component: ''
    }

    if (Object.keys(simulatedBlock.ins).includes(info.label)) {
        info.value = simulatedBlock.ins[info.label].value
        info.component = 'ins'
    } else if (Object.keys(simulatedBlock.outs).includes(info.label)) {
        info.value = simulatedBlock.outs[info.label].value
        info.component = 'outs'
    } else if (Object.keys(simulatedBlock.blocks).includes(info.label)) {
        info.value = simulatedBlock.blocks[info.label][info.port].value
        info.component = 'blocks'
    }

    return info
}

function splitLabelPorts(...labelPorts) {
    let info = []
    for (let labelPort of labelPorts) info.push(splitLabelPort(labelPort))
    return info
}

// #endregion


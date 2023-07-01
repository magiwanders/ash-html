(function(o,i){typeof exports=="object"&&typeof module<"u"?i(exports):typeof define=="function"&&define.amd?define(["exports"],i):(o=typeof globalThis<"u"?globalThis:o||self,i(o["ash-js"]={}))})(this,function(o){"use strict";function i(n){return new Promise(e=>setTimeout(e,n))}function a(n){return window.URL.createObjectURL(new Blob([n],{type:"text/javascript"}))}const c=`onmessage = (msg) => self[msg.data.do](msg.data)
addCode = (args) => importScripts(args.script)
removeCode = (args) => self[args.name] = () => {}`;class r{constructor(){this._worker=new Worker(a(c)),this._worker.onmessage=e=>{console.log("RECEIVING <-",e.data)}}postMessage(e){this._worker.postMessage(e)}addFn(e){this.addCode(e.toString()),this[e.name]=t=>{let l={do:e.name};for(let s in t)l[s]=t[s];this._worker.postMessage(l)}}addCode(e){this._worker.postMessage({do:"addCode",script:a(e)})}removeFn(e){delete this[e]}}const p=`// #region Header

// Ins and outs contained in the variables below can only accept two values:
const LOW = 0
const HIGH = 1

/* Lists the supported chips that can be used in the simulation, each with a structure and specification. Supplied externally.

################################################
# <label> is ALWAYS <type>_<progressiveNumber> #
################################################

supportedChips = {
    <type>: {
        structure: {
            ins: ['a', 'b', ...],
            outs: ['out', ...],
            chips: {
                <label>: {
                    <out>: [
                        '<label>:<port>',
                        '<label>:<port>',
                        ...
                    ],
                }
                <label>: {
                    <out>: [
                        '<label>:<port>',
                        '<label>:<port>',
                        ...
                    ],
                }
                <label>:
                ...
            },
        }, 
        spec: ({a=0, b=0, c=0, ...}) => {
            outs = f(ins)
            return {out: <value>}
        }
    }

}

*/
let supportedChips = {}

/*
The structure holds the current simulated netlist, with values for each global in, value of each connection, and global outputs.
A connection tracks of the list of all inputs that listen to each output, to keeps them updated with the value of the output as it changes.

structure = {
    ins: {
        in1: {
            value: 0,
            listeners: [
                '<label>:<port>',
                '<label>:<port>',
                ...
            ],
        } 
        in2: {
            value: 0,
            listeners: [
                '<label>:<port>',
                '<label>:<port>',
                ...
            ],
        },
        ...
    },
    outs: {
        out1: 0, 
        ...
    },
    chips: {
        <label>: {
            <out>: {
                value: 0,
                listeners: [
                    '<label>:<port>',
                    '<label>:<port>',
                    ...
                ],
            }
        }
        <label>: {
            <out>: {
                value: 0,
                listeners: [
                    '<label>:<port>',
                    '<label>:<port>',
                    ...
                ],
            }
        }
        <label>:
        ...
    },
}

*/

let structure = {}

// #endregion


// #region Functions

// Reset the whole simulator
function resetAll() {
    supportedChips = {}
    reset()
}

// Reset only the simulated netlist structure
function reset() {
    structure = {}
}

// Adds a component to the simulation.
function addComponent({what, type, label}) {
    switch (what) {
        case 'in': if (structure.ins[label]==undefined) structure.ins[label].value = LOW; break;
        case 'out': if (structure.outs[label]==undefined) structure.outs[label] = LOW; break;
        case 'chip': if (structure.chips[label]==undefined) for(let i in supportedChips[type].structure.outs) structure.chips[label][i].value = LOW; break;
        default: break;
    }
}

// Connects output <from> to input <to> and makes sure that input receives current output value. Both are expressed as <label>:<port>, that is <type>_<progressiveNumber>:<port>
// Adds the input "to" to the listeners of output "from". 
// TODO Since each input can listen to only one ouput, if the input was already conected, only the new connection is maintained.
function connect({from, to}) {
    let l = getInfo(from)
    structure.chips[l.label][l.port].push(to)
    
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
    let l = getInfo(label)
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
function getInfo(labelPort) {
    // console.log("Info on", label)
    if (Object.keys(structure.ins).includes(labelPort) ) return {value: structure.ins[labelPort]}
    if (Object.keys(structure.outs).includes(labelPort) ) return {value: structure.outs[labelPort]}

    // TODO case labelPort.indexOf(':')!=-1
    let label = labelPort.substring(0, labelPort.indexOf(':'))

    for(chip in structure.chips) {
        for(out in chip.)
    }

    return {
        label: label,
        port:  labelPort.substring(labelPort.indexOf(':')+1, labelPort.length), 
        value: value,
        type: label.substring(0, labelPort.indexOf('_'))
    }
}

// Checks if given input is already connected to an output. 
function isAlreadyConnected(input) {
    for (output of Object.keys(connections)) {
        if (input in connections[output]) return true
    }
    return false
}

// #endregion

`;class d extends r{constructor(){super(),this.addCode(p)}addSupportedChip(e){this.addCode("supportedChips['"+e.type+`'] = {
                name: '`+e.type+`',
                structure: `+JSON.stringify(e.structure)+`,
                spec: `+e.spec.toString()+`
            }`)}}console.log("ash-js loaded correctly!");let u="_Object";window[u]=(n="",e={},t=[""])=>{var l=document.createElement(n);for(key in e)l.setAttribute(key,e[key]);return(typeof t=="string"||t[0]===void 0)&&(t=[t]),t.forEach(s=>{typeof s=="string"?l.appendChild(document.createTextNode(s)):l.appendChild(s)}),l},window._css=(n={})=>{let e="";for(let t in n)e+=`
`+t+": "+n[t]+";";return e};for(let n of["html","head","body","title","h1","h2","h3","h4","h5","h6","p","b","i","em","mark","small","strong","sub","sup","br","wbr","abbr","address","bdi","bdo","pre","u","blockquote","cite","code","q","rt","samp","del","s","ins","ruby","dfn","rp","kbd","meter","progress","template","time","form","input","textarea","button","fieldset","legend","datalist","output","label","select","optgroup","option","iframe","img","map","area","canvas","figure","picture","svg","figcaption","audio","source","track","video","a","link","nav","ul","ol","li","dl","dt","dd","table","caption","th","tr","td","thead","tbody","tfoot","col","colgroup","style","div","span","header","footer","main","section","article","aside","details","dialog","summary","data","meta","base","script","noscript","embed","object","param"])window["_"+n]=new Function("attributes","children","return "+u+'("'+n+'", attributes, children)');let b={wait:{ms:i},AshSim:d};o.DynamicWorkerWithoutAck=r,o.ash=b,Object.defineProperty(o,Symbol.toStringTag,{value:"Module"})});

import { scriptize, ms, randID } from "./misc"

export const basicWorkerCodeWithoutAck = 
`onmessage = (msg) => self[msg.data.do](msg.data)
addCode = (args) => importScripts(args.script)
removeCode = (args) => self[args.name] = () => {}`


export class DynamicWorkerWithoutAck {
    constructor() {
        this._worker = new Worker(scriptize(basicWorkerCodeWithoutAck))
        this._worker.onmessage = (msg) => {console.log('RECEIVING <-', msg.data)}
    }

    postMessage(msg) {
        this._worker.postMessage(msg)
    }

    addFn(fn) {
        this.addCode(fn.toString())
        this[fn.name] = (args) => {
            let msg = {do: fn.name}
            for (let arg in args) msg[arg] = args[arg]
            this._worker.postMessage(msg)
        }
    }

    addCode(codeString) {
        this._worker.postMessage({do: 'addCode', script: scriptize(codeString)})
    }

    // TODO: Make the function also remove the blob from the worker.  
    removeFn(fnName) {
        delete this[fnName]
        // await this._postMessage({do: 'removeFn', name: fnName})
    }
}


export const basicWorkerCodeWithAck = 
`onmessage = (msg) => postMessage({result: self[msg.data.do](msg.data), ack: msg.data.id})
addFn = (args) => importScripts(args.script)
removeFn = (args) => self[args.name] = () => {}`

export class DynamicWorkerWithAck  {
    constructor() {
        this._worker = new Worker(scriptize(basicWorkerCodeWithAck))
        this._worker.onmessage = (msg) => {
            console.log('RECEIVING <-', msg.data)
            this._ack[msg.data.ack] = {
                received: 1,
                result: msg.data.result
            }
        }
        this._ack = {}
    }

    async _postMessage(msg) {
        return new Promise(async (resolve, reject) => {
            let id = randID(16)
            this._ack[id] = {
                received: 0,
                result: undefined,
            }
            msg.id = id
            console.log('SENDING -> ', msg)
            this._worker.postMessage(msg)
            while (this._ack[id].received == 0) await ms(1)
            let toReturn = this._ack[id].result
            delete this._ack[id]
            resolve(toReturn)
        })
    }

    async addFn(fn) {
        return new Promise(async (resolve, reject) => {
            await this.addCode(fn.toString())
            this[fn.name] = async (args) => {
                let msg = {do: fn.name}
                for (let arg in args) msg[arg] = args[arg]
                return await this._postMessage(msg)
            }
            resolve(1)
        })
    }

    async addCode(codeString) {
        return new Promise(async (resolve, reject) => {
            await this._postMessage({do: 'addFn', script: scriptize(codeString)})
            resolve()
        })
    }

    // TODO: Make the function also remove the blob from the worker.  
    async removeFn(fnName) {
        delete this[fnName]
        // await this._postMessage({do: 'removeFn', name: fnName})
    }
}

// EXAMPLE
// import {ash, DynamicWorker} from "/dist/ash-js.js"
// let w = new DynamicWorker()

// function ping() {
//     return 'Ping Back!'
// }
// await w.addFn(ping)

// function add(args) {
//     return args.a+args.b
// }
// await w.addFn(add)
// // await ash.wait.ms(1000)
// console.log(await w.ping())
// console.log(await w.add({a:1, b:2}))
// await w.removeFn('add')
// await w.removeFn('ping')
// // await ash.wait.ms(1000) 
// await w.ping()
// // w._worker.postMessage({do: 'ping'})
// // await w.add({a:1, b:2})

// await w.addCode('let prooova=123')
// function prova({b=2}) {
//     return b+prooova
// }
// await w.addFn(prova)
// console.log(await w.prova({b: 5}))
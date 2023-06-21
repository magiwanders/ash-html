import { scriptize, ms, randID } from "./misc"


export const basicWorkerCode = 
`onmessage = (msg) => postMessage({result: self[msg.data.do](msg.data), ack: msg.data.id})
addFn = (args) => importScripts(args.script)
removeFn = (args) => self[args.name] = () => {}`
export const basicWorkerCodeNoAck = 
`onmessage = (msg) => self[msg.data.do](msg.data)
addFn = (args) => importScripts(args.script)
removeFn = (args) => self[args.name] = () => {return undefined}`


export class DynamicWorker  {
    constructor() {
        this._worker = new Worker(scriptize(basicWorkerCode))
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
            await this._postMessage({do: 'addFn', script: scriptize(fn.toString())})
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
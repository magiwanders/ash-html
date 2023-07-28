import { DynamicWorkerWithoutAck } from "./util/dynamic-worker-classes";
import { scriptize } from "./util/misc";
import ashSimCode from './util/ash-sim-worker.js?raw'

export class AshSim extends DynamicWorkerWithoutAck {
    constructor() {
        super()
        this.addCode(ashSimCode)
    }

    addSupportedChip(chip) {
        this.addCode(
            `supportedChips['`+chip.type+`'] = {
                name: '`+chip.type+`',
                structure: `+JSON.stringify(chip.structure)+`,
                spec: `+chip.spec.toString()+`
            }`)
    }
}

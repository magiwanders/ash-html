// Makes string into a script that can be used for creating a worker.
function getWorker() {
	return new Worker(
        window.URL.createObjectURL(
            new Blob(
                [
                    `onmessage = (msg) => self[msg.data.do](msg.data)
                    addFn = (data) => importScripts(data.script)
                    removeFn = (data) => delete self[data.name]`
                ],
                {type: 'text/javascript'}
            )
        )
	)
}

export function getSimulator() {
    let w = getWorker()
    
    return w
}
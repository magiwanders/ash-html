export function ms (ms) {
    return new Promise(res => setTimeout(res, ms))
}

export function scriptize (codeString) {
    return window.URL.createObjectURL(
        new Blob(
            [codeString],
            {type: 'text/javascript'}
        )
    )
}

export function randID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i=0; i<length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}
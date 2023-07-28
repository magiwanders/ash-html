const example = 
`
BLOCK name
    IN a b
    OUT out
    CONNECTIONS
        a -> name1.a
        b -> name1.b
        name1.out -> out
    SPEC (a, b) => { return a&b }
`

blockList = {}

function addBlock(code) {
    console.assert()
}
let audioContext = null;

async function createMyAudioProcessor() {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
      await audioContext.resume();
      await audioContext.audioWorklet.addModule("module-url/module.js");
    } catch (e) {
      return null;
    }
  }

  return new AudioWorkletNode(audioContext, "processor-name");
}

let newProcessorNode = createMyAudioProcessor();

let gainParam = newProcessorNode.parameters.get("gain");
gainParam.setValueAtTime(newValue, audioContext.currentTime);
let currentGain = gainParam.value;
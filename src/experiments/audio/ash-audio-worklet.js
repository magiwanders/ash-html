class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
    }
  
    process(inputList, outputList, parameters) {
        const input = inputList[0];
        const output = outputList[0];
        const gain = parameters.gain;
      
        for (let channelNum = 0; channelNum < input.length; channelNum++) {
          const inputChannel = input[channelNum];
          const outputChannel = output[channelNum];
      
          // If gain.length is 1, it's a k-rate parameter, so apply
          // the first entry to every frame. Otherwise, apply each
          // entry to the corresponding frame.
      
          if (gain.length === 1) {
            for (let i = 0; i < inputChannel.length; i++) {
              outputChannel[i] = inputChannel[i] * gain[0];
            }
          } else {
            for (let i = 0; i < inputChannel.length; i++) {
              outputChannel[i] = inputChannel[i] * gain[i];
            }
          }
        }
      
        return true;
      }

    static get parameterDescriptors() {
        return [
         {
            name: "gain",
            defaultValue: 0.5,
            minValue: 0,
            maxValue: 1
          },
          {
            name: "frequency",
            defaultValue: 440.0,
            minValue: 27.5,
            maxValue: 4186.009
          }
        ];
      }
  }
  
  registerProcessor("my-audio-processor", MyAudioProcessor);
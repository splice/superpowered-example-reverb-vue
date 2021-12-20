// Import the SuperpoweredWebAudio helper to allow us to extend the SuperpoweredWebAudio.AudioWorkletProcessor class

import { SuperpoweredWebAudio } from "./superpowered/SuperpoweredWebAudio.js";

class ReverbProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
  // Runs after the constructor
  onReady() {
    // Create an instance of a SP generator class

    this.reverb = new this.Superpowered.Reverb(
      this.samplerate, // The initial sample rate in Hz.
      this.samplerate // Maximum sample rate (affects memory usage, the lower the smaller).
    );
    // enable the reverb

    this.reverb.enabled = true;
  }

  // messages are received from the main scope through this method.
  onMessageFromMainScope(message) {
    console.log(message);

    if (message.command === "requestUiDefinitions") {
      this.sendMessageToMainScope({ uiDefinitions: uiDefinitions });
    }
    if (message.command === "destruct") {
      console.log("destructuring reverb");
      this.reverb.destruct();
    }
    // UI parameters
    if (typeof message.mix !== "undefined") this.reverb.mix = message.mix;
    if (typeof message.width !== "undefined") this.reverb.width = message.width;
    if (typeof message.damp !== "undefined") this.reverb.damp = message.damp;
    if (typeof message.roomSize !== "undefined")
      this.reverb.roomSize = message.roomSize;
    if (typeof message.predelayMs !== "undefined")
      this.reverb.predelayMs = message.predelayMs;
    if (typeof message.lowCutHz !== "undefined")
      this.reverb.lowCutHz = message.lowCutHz;
  }

  processAudio(inputBuffer, outputBuffer, buffersize, parameters) {
    if (this.reverb.process)
      this.reverb.process(
        inputBuffer.pointer,
        outputBuffer.pointer,
        buffersize
      );
  }
}

// The following code registers the processor script in the browser, notice the label and reference
if (typeof AudioWorkletProcessor === "function")
  registerProcessor("ReverbProcessor", ReverbProcessor);
export default ReverbProcessor;

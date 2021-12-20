<template>
  <img
    id="superpowered-logo"
    alt="Superpowered logo"
    src="./assets/superpowered-black.svg"
  />
  <img alt="Vue logo" src="./assets/logo.png" />
  <h3>
    The following example will take your microphone and <br />pass it through
    WebAssembly Superpowered Reverb
  </h3>
  <h4>Please wear headphones or turn down you speakers!</h4>
  <!--Button renders conditionally to make sure Superpowered WebAssembly was loaded. Dissappears once the WebAudioManager is created.
   -->
  <button v-if="$data.Superpowered && !$data.webAudioManager" @click="onBoot()">
    Boot Reverb
  </button>

  <div id="reverb-ui" v-if="$data.webAudioManager">
    <input
      type="range"
      id="mix"
      step="0.01"
      defaultValue="0.5"
      min="0"
      max="1"
      @input="onParamChange('mix', $event)"
    />
    <label for="mix">Mix</label>
    <input
      type="range"
      id="width"
      step="0.01"
      defaultValue="0.5"
      min="0"
      max="1"
      @input="onParamChange('width', $event)"
    />
    <label for="width">Width</label>
    <input
      type="range"
      id="damp"
      step="0.01"
      defaultValue="0.5"
      min="0"
      max="1"
      @input="onParamChange('damp', $event)"
    />
    <label for="damp">Damp</label>
    <input
      type="range"
      id="roomSize"
      step="0.01"
      defaultValue="0.5"
      min="0"
      max="1"
      @input="onParamChange('roomSize', $event)"
    />
    <label for="roomSize">Room Size</label>
    <input
      type="range"
      id="predelayMs"
      step="1"
      defaultValue="9"
      min="0"
      max="500"
      @input="onParamChange('predelayMs', $event)"
    />
    <label for="predelayMs">Pre Delay (ms)</label>
    <input
      type="range"
      id="lowCutHz"
      step="1"
      defaultValue="100"
      min="20"
      max="500"
      @input="onParamChange('lowCutHz', $event)"
    />
    <label for="lowCutHz">Low Cut (Hz)</label>
    <div>
      <p>
        Sample Rate:
        {{ $data.webAudioManager.audioContext.sampleRate / 1000 }}
        kHz
      </p>
      <p>
        Estimated Latency:
        {{ $data.webAudioManager.audioContext.baseLatency.toFixed(3) }}
        s
      </p>
    </div>
  </div>
</template>

<script>
import {
  SuperpoweredGlue,
  SuperpoweredWebAudio,
} from "./assets/superpowered/SuperpoweredWebAudio.js";

export default {
  name: "App",
  data() {
    return {
      Superpowered: null, // Reference to the Superpowered module.
      webAudioManager: null, // The SuperpoweredWebAudio helper class managing Web Audio for us.
      audioNode: null, // This example uses one audio node only.
    };
  },
  methods: {
    //Instantite and initialize the Superpowered WebAssembly
    async createWebAssembly() {
      this.Superpowered = await SuperpoweredGlue.fetch(
        "./superpowered/superpowered.wasm"
      );
      this.Superpowered.Initialize({
        licenseKey: "ExampleLicenseKey-WillExpire-OnNextUpdate",
        enableAudioAnalysis: true,
        enableFFTAndFrequencyDomain: false,
        enableAudioTimeStretching: false,
        enableAudioEffects: true,
        enableAudioPlayerAndDecoder: false,
        enableCryptographics: false,
        enableNetworking: false,
      });
    },
    // Create a WebAudioManager
    createWebAudioManager() {
      this.webAudioManager = new SuperpoweredWebAudio(48000, this.Superpowered);
    },
    // loads our AudioWorkletProcessor reverbProcessor.js into the WebAudio AudioContext
    async loadReverb() {
      let micStream = await this.webAudioManager
        .getUserMediaForAudioAsync({ fastAndTransparentAudio: true })
        .catch((error) => {
          // called when the user refused microphone permission
          console.log(error);
        });

      if (!micStream) return;

      let currentPath = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/")
      );

      //use the WebAudioManager to create the audioNode for reverbProcessor
      this.audioNode = await this.webAudioManager.createAudioNodeAsync(
        currentPath + "reverbProcessor.js",
        "ReverbProcessor"
      );
      let audioInput = this.webAudioManager.audioContext.createMediaStreamSource(
        micStream
      );

      // connect the microphone input node to reverb
      audioInput.connect(this.audioNode);

      // connect the reverb node to end destination node
      this.audioNode.connect(this.webAudioManager.audioContext.destination);
    },
    onBoot() {
      this.createWebAudioManager();
      this.loadReverb();
    },
    onParamChange(id, e) {
      const typecastedVal = Number(e.target.value);

      this.audioNode.sendMessageToAudioScope({ [id]: typecastedVal });
    },
  },
  created() {
    this.createWebAssembly();
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 50px;

  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  padding: 10px;
}

#superpowered-logo {
  width: 100%;
  margin-bottom: 60px;
}

#reverb-ui {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
}
#reverb-ui label {
  margin-bottom: 20px;
}
#reverb-ui input {
  width: 200px;
}
</style>

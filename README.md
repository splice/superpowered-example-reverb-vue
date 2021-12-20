# superpowered-example-reverb-vue

A demo of the superpowered reverb using standard Vue.js development tooling / Vue CLI.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

## Walkthrough

# Getting Started with Superpowered using Vue.js

Follow these steps to get started with Superpowered in your Vue.js project.

We will create a demo of the superpowered reverb using the Vue CLI.

## Create the project

```
vue create project-name
```

Select the default Vue 3 preset when prompted.

## Loading the Superpowered Library

### Download and copy the Superpowered Library

1. Download the superpowered library from [here](https://superpowered.com/download).
2. Copy the superpowered library folder into ./project-name/src/assets **and** ./project-name/public

### Open in a code editor and delete unwanted Vue boilerplate code

```
cd project-name
```

Open ./src/App.vue

We can delete the default HelloWorld component App.vue

```diff
<!--./src/App.vue-->

<template>
  <img alt="Vue logo" src="./assets/logo.png">
- <HelloWorld msg="Welcome to Your Vue.js App"/>
</template>

<script>
- import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
- components: {
-   HelloWorld
- }
}
</script>
...
```

### Instantiate and initialize the Superpowered WebAssembly

We write the async createWebAssembly() function to do this. Once instantiated, pass your license details and functionality requirements into the initialize method.

This function is called in the created() Lifecycle hook.

```diff
<!--./src/App.vue-->
...
<script>
+import { SuperpoweredGlue } from "./assets/superpowered/SuperpoweredWebAudio.js";

export default {
  name: "App",
+  data() {
+    return {
+      Superpowered: null, // Reference to the Superpowered module.
+    };
+  },
+  methods: {
+    async loadSuperpowered() {
+      this.Superpowered = await SuperpoweredGlue.fetch(
+        "./superpowered/superpowered.wasm"
+      );
+      this.Superpowered.Initialize({
+        licenseKey: "ExampleLicenseKey-WillExpire-OnNextUpdate",
+        enableAudioAnalysis: true,
+        enableFFTAndFrequencyDomain: false,
+        enableAudioTimeStretching: false,
+        enableAudioEffects: true,
+        enableAudioPlayerAndDecoder: false,
+        enableCryptographics: false,
+        enableNetworking: false,
+      });
+    },
+  },
+  created() {
+    this.loadSuperpowered();
+  },
};
</script>
...
```

## Create a WebAudioManager

We create the WebAudioManager using the SuperpoweredGlue wrapper, passing in both the samplerate and the instantiated WebAssembly.

```diff
<!--./src/App.vue-->
...
<script>
import {
  SuperpoweredGlue,
+  SuperpoweredWebAudio,
} from "./assets/superpowered/SuperpoweredWebAudio.js";

export default {
  name: "App",
  data() {
    return {
      Superpowered: null, // Reference to the Superpowered module.
+      webAudioManager: null,
    };
  },
  methods: {
    //Instantite and initialize the Superpowered WebAssembly
    async loadSuperpowered() {
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
+    createWebAudioManager() {
+      this.webaudioManager = new SuperpoweredWebAudio(48000, this.Superpowered);
+    },
+  },
  created() {
    this.loadSuperpowered();
  },
};
</script>
```

### Add a Button

The WebAudio AudioContext should be created after a user interaction on the page - so we add a button to our app template to call createWebAudioManager() using @click.

The button is rendered conditionally (using 'v-if') when the WebAssembly has loaded and the WebAudioManager hasn't yet loaded.

```diff
<!--./src/App.vue-->
<template>
...
+  <button v-if="$data.Superpowered && !$data.webAudioManager" @click="createWebAudioManager()">
+    Boot Reverb
+  </button>
<template>
```

### Display some information from audioContext to confirm that everything works so far..

To demonstarate that we now have a WebAudio AudioContext we can render some of its properties.

Create a div which renders if the WebAudioManager was created.

For now, we will use it to display the sample rate and base latency provided by the WebAudio AudioContext.

```diff
<!--./src/App.vue-->
<template>
...
  <button v-if="$data.Superpowered && !$data.webAudioManager" @click="onBoot()">
    Boot Reverb
  </button>

+  <div id="reverb-ui" v-if="$data.webAudioManager">
+    <p>
+      Sample Rate:
+      {{ $data.webAudioManager.audioContext.sampleRate / 1000 }}
+      kHz
+    </p>
+    <p>
+      Estimated Latency:
+      {{ $data.webAudioManager.audioContext.baseLatency.toFixed(3) }}
+      s
+    </p>
+  </div>
<template>
```

## Create an AudioWorkletProcessor

Create a file called reverbProcessor.js in the public directory.

We can create a custom processor by extending the SuperpoweredWebAudio.AudioWorkletProcessor class.

Copy-paste the following code into reverbProcessor.js:

```
// ./public/reverbProcessor.js

import { SuperpoweredWebAudio } from "./superpowered/SuperpoweredWebAudio.js";

class ReverbProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
  onReady() {
    this.reverb = new this.Superpowered.Reverb(
      this.samplerate,
      this.samplerate
    );
    this.reverb.enabled = true;
  }

  onMessageFromMainScope(message) {
    if (message.command === "requestUiDefinitions") {
      this.sendMessageToMainScope({ uiDefinitions: uiDefinitions });
    }
    if (message.command === "destruct") {
      console.log("destructuring reverb");
      this.reverb.destruct();
    }
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

if (typeof AudioWorkletProcessor === "function")
  registerProcessor("ReverbProcessor", ReverbProcessor);
export default ReverbProcessor;
```

## Load our AudioWorkletProcessor into the WebAudio AudioContext to be scheduled.

We now need to load reverbProcessor into the AudioContext, and connect all AudioNodes together.

### Write loadReverb() as an App component method

loadReverb is an async function that asks for mic permissions, creates mic and reverb AudioNodes and makes the necessary connections:

```diff
<!--./src/App.vue-->
...
<script>
...
export default {
  ...
  methods: {
    ...
+    async loadReverb() {
+      let micStream = await this.webAudioManager
+        .getUserMediaForAudioAsync({ fastAndTransparentAudio: true })
+        .catch((error) => {
+          // called when the user refused microphone permission
+          console.log(error);
+        });
+      if (!micStream) return;

+      let currentPath = window.location.pathname.substring(
+        0,
+        window.location.pathname.lastIndexOf("/")
+      );

+      this.audioNode = await this.webAudioManager.createAudioNodeAsync(
+        currentPath + "reverbProcessor.js",
+        "ReverbProcessor"
+      );
+      let audioInput = this.webAudioManager.audioContext.createMediaStreamSource(
+        micStream
+      );
+      audioInput.connect(this.audioNode);
+      this.audioNode.connect(this.webAudioManager.audioContext.destination);
+    },
    ...
  },
  ...
};
</script>
```

### Write onBoot() method

We need to call loadReverb() once the WebAudio AudioContext has been created (by createWebAudioManager()).

onBoot() will sequence this and be used as our button click event handler.

```diff
<!--./src/App.vue-->
...
<script>
...
export default {
  ...
  methods: {
    ...
+    onBoot() {
+      this.createWebAudioManager();
+      this.loadReverb();
+    },
  },
...
};
</script>

```

### Update button click handler

```diff
<!--./src/App.vue-->
<template>
...
-  <button v-if="$data.Superpowered && !$data.webAudioManager" @click="createWebAudioManager()">
-    Boot Reverb
-  </button>
+  <button v-if="$data.Superpowered && !$data.webAudioManager" @click="onBoot()">
+    Boot Reverb
+  </button>
<template>
```

## Adding UI control

Our final step is to add input range sliders - so that the user can control the reverb parameters.

### Write onParamChange() method

onParamChange() will be used to handle all user input.

It takes id and the input event, and sends a message object ({id: e.target.value}) to the reverb using this.audioNode.sendMessageToAudioScope.

```diff
<!--./src/App.vue-->
...
<script>
...
export default {
  ...
  methods: {
    ...
+    onParamChange(id, e) {
+      this.audioNode.sendMessageToAudioScope({ [id]: e.target.value });
+    },
  },
};
</script>
...
```

### Add a range input to control reverb wet/dry mix

We will use the input element to scale to our desired range (0 - 1) and use the onParamChange() as the @input handler.

```diff
<!--./src/App.vue-->

<template>
  ...
  <div id="reverb-ui" v-if="$data.webAudioManager">
+    <input
+      type="range"
+      id="mix"
+      step="0.01"
+      defaultValue="0.5"
+      min="0"
+      max="1"
+      @input="onParamChange('mix', $event)"
+    />
+    <label for="mix">Mix</label>
    ...
  </div>
</template>
...
```

### Repeat for each parameter in ./public/reverbProcessor.js

The input min, max and step need to be changed according to the reverb parameter. You can check these in the API Reference documentaion [here](https://superpowered-docs-dev.synervoz.com/reference/latest/reverb?lang=js)

The final markup for the sliders will be:

```
<!--./src/App.vue-->


<template>
...
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
...
  </div>
</template>
...

```


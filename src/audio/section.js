import { EQController } from "./eq-controller.js";
import chordPresets from "./chord-presets.js";

export class Section {
  constructor(params) {
    this.validateParams(params);

    this.startTime = params.startTime || 0;
    this.duration = Number(params.sectionLength) || 5;
    this.numVoices = params.numVoices || 10;
    this.oscType = params.oscType || "sawtooth";
    this.movementType = params.movementType || "direct";
    this.startSpread = params.startSpread || "even";
    this.highpassFreq = params.highpassFreq || 80;
    this.lowpassFreq = params.lowpassFreq || 7000;
    this.reverbAmount = params.reverbAmount || 0.3;
    this.isLastSection = params.isLastSection || false;

    // Add target EQ values for transitions
    this.targetHighpassFreq = params.targetHighpassFreq || this.highpassFreq;
    this.targetLowpassFreq = params.targetLowpassFreq || this.lowpassFreq;

    // Convert chord names to frequencies
    this.startPos = this.convertToFrequencies(params.startPos);
    this.endPos = this.convertToFrequencies(params.endPos);
  }

  convertToFrequencies(input) {
    if (typeof input === "string") {
      if (!chordPresets[input]) {
        console.error(`Unknown chord: ${input}`);
        return chordPresets["C"]; // Fallback to C
      }
      return chordPresets[input];
    }
    return input;
  }

  validateParams(params) {
    if (!params) {
      throw new Error("Section parameters are required");
    }
    if (
      params.sectionLength !== undefined &&
      (isNaN(Number(params.sectionLength)) || Number(params.sectionLength) <= 0)
    ) {
      throw new Error("Invalid section length");
    }
  }

  distributeVoices(frequencies, numVoices) {
    if (Array.isArray(frequencies)) {
      if (frequencies.length === 2) {
        // Handle range
        const [min, max] = frequencies;
        return this.startSpread === "even"
          ? Array.from(
              { length: numVoices },
              (_, i) => min + (max - min) * (i / (numVoices - 1))
            )
          : Array.from(
              { length: numVoices },
              () => min + Math.random() * (max - min)
            );
      }
      // Handle chord frequencies
      return Array.from(
        { length: numVoices },
        (_, i) => frequencies[i % frequencies.length]
      );
    }
    throw new Error("Invalid frequency input");
  }

  schedule(audioCtx, gainNode, previousSectionOutput = null) {
    const voices = this.distributeVoices(this.startPos, this.numVoices);
    const outputGain = audioCtx.createGain(); // Output gain for this section

    // Connect the previous section's output to this section's input for seamless transitions
    if (previousSectionOutput) {
      previousSectionOutput.connect(outputGain);
    }

    voices.forEach((startFreq) => {
      const { osc, gain } = this.createVoice(
        audioCtx,
        startFreq,
        this.startTime
      );

      if (this.movementType === "random") {
        this.scheduleRandomMovement(osc, startFreq);
      } else {
        this.scheduleDirectMovement(osc, startFreq);
      }

      gain.connect(outputGain);
    });

    // Connect the output gain to the main gain node
    outputGain.connect(gainNode);

    return outputGain; // Return the output gain for the next section
  }

  createReverbEffect(audioCtx) {
    const convolver = audioCtx.createConvolver();
    const reverbTime = 2;
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * reverbTime;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] =
          (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.1));
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  createVoice(audioCtx, frequency, startTime) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const eq = new EQController(audioCtx);

    // Create reverb effect
    const reverb = this.createReverbEffect(audioCtx);
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();

    // Set reverb mix
    dryGain.gain.value = 1 - this.reverbAmount;
    wetGain.gain.value = this.reverbAmount;

    // Setup oscillator
    osc.type = this.oscType;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Ensure oscillators are started and connected to the audio graph
    osc.start(startTime);
    console.log(`Oscillator started at ${startTime}`);

    // Setup EQ with transition scheduling
    const endTime = startTime + this.duration;
    eq.setHighPass(this.highpassFreq, startTime);
    eq.setLowPass(this.lowpassFreq, startTime);

    // Schedule transition to target values if they're different
    if (this.targetHighpassFreq !== this.highpassFreq) {
      eq.setHighPass(this.targetHighpassFreq, endTime);
    }

    if (this.targetLowpassFreq !== this.lowpassFreq) {
      eq.setLowPass(this.targetLowpassFreq, endTime);
    }

    // Setup gain with fadeout if last section
    if (this.isLastSection) {
      gain.gain.setValueAtTime(1.0 / this.numVoices, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + this.duration);
    } else {
      gain.gain.setValueAtTime(1.0 / this.numVoices, startTime);
    }

    // Connect audio chain with reverb
    osc.connect(eq.highpass);
    eq.lowpass.connect(dryGain);
    eq.lowpass.connect(reverb);
    reverb.connect(wetGain);
    dryGain.connect(gain);
    wetGain.connect(gain);

    return { osc, gain, eq };
  }

  scheduleRandomMovement(osc, startFreq) {
    const steps = Math.floor(this.duration * 2);
    const stepTime = this.duration / steps;

    for (let i = 0; i < steps; i++) {
      const time = this.startTime + i * stepTime;

      if (Array.isArray(this.endPos)) {
        // Random movement within range
        const [min, max] = this.endPos;
        const randomFreq = min + Math.random() * (max - min);
        osc.frequency.setValueAtTime(randomFreq, time);
      } else if (i === steps - 1) {
        // Final movement to target chord
        const targetFreq = this.endPos;
        osc.frequency.linearRampToValueAtTime(
          targetFreq,
          this.startTime + this.duration
        );
      } else {
        // Random movement before reaching chord
        const currentFreq = osc.frequency.value;
        const range = 100 * (1 - i / steps); // Gradually reduce range
        const randomFreq = currentFreq + (Math.random() * range - range / 2);
        osc.frequency.setValueAtTime(randomFreq, time);
      }
    }
  }

  scheduleDirectMovement(osc, startFreq) {
    const endFreq = Array.isArray(this.endPos)
      ? (this.endPos[0] + this.endPos[1]) / 2
      : this.endPos;

    osc.frequency.setValueAtTime(startFreq, this.startTime);
    osc.frequency.linearRampToValueAtTime(
      endFreq,
      this.startTime + this.duration
    );
  }
}

export default Section;

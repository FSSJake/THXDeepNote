import { Section } from "./section.js";
import { EQController } from "./eq-controller.js";

export function playCustomSound(section, audioCtx) {
  try {
    console.log("Creating audio nodes for section");
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.8; // Ensure audible output

    const startFrequencies = section.distributeVoices(
      section.startPos,
      section.numVoices
    );
    const endFrequencies = section.distributeVoices(
      section.endPos,
      section.numVoices
    );

    const sectionStartTime = audioCtx.currentTime + section.startTime;
    const sectionEndTime = sectionStartTime + section.duration;

    console.log("Section timing:", {
      contextTime: audioCtx.currentTime,
      startTime: sectionStartTime,
      endTime: sectionEndTime,
      duration: section.duration,
    });

    const oscillators = startFrequencies.map((startFreq, i) => {
      const osc = audioCtx.createOscillator();
      const voiceGain = audioCtx.createGain();

      // Direct connection first for testing
      osc.connect(voiceGain);
      voiceGain.connect(masterGain);

      // Configure oscillator
      osc.type = section.oscType;
      const validStartFreq = Number.isFinite(startFreq) ? startFreq : 440;
      const validEndFreq = Number.isFinite(endFrequencies[i])
        ? endFrequencies[i]
        : 440;

      // Check if start and end frequencies are identical
      if (
        section.movementType === "direct" &&
        validStartFreq === validEndFreq
      ) {
        console.log(
          `Oscillator ${i} has identical start and end frequencies:`,
          {
            frequency: validStartFreq,
            startTime: sectionStartTime,
          }
        );
        osc.frequency.setValueAtTime(validStartFreq, sectionStartTime);
      } else if (section.movementType === "direct") {
        console.log(`Oscillator ${i} direct transition:`, {
          startFreq: validStartFreq,
          endFreq: validEndFreq,
          startTime: sectionStartTime,
          endTime: sectionEndTime,
        });
        osc.frequency.linearRampToValueAtTime(validEndFreq, sectionEndTime);
      } else if (section.movementType === "random") {
        const steps = 3;
        const stepTime = section.duration / steps;

        for (let step = 0; step < steps; step++) {
          const time = sectionStartTime + step * stepTime;
          const progress = step / steps;

          if (Array.isArray(section.endPos) && section.endPos.length === 2) {
            const [minFreq, maxFreq] = section.endPos;
            const randomFreq = minFreq + Math.random() * (maxFreq - minFreq);
            osc.frequency.linearRampToValueAtTime(randomFreq, time + stepTime);
          } else {
            const randomVariation = (1 - progress) * (validEndFreq * 0.1);
            const targetFreq =
              validEndFreq + (Math.random() * 2 - 1) * randomVariation;
            osc.frequency.linearRampToValueAtTime(targetFreq, time + stepTime);
          }
        }
      }

      console.log(`Oscillator ${i} setup:`, {
        startFreq: validStartFreq,
        endFreq: validEndFreq,
        type: section.oscType,
        startTime: sectionStartTime,
      });

      return { osc, voiceGain };
    });

    // Start oscillators
    console.log("Starting oscillators");
    oscillators.forEach(({ osc }) => {
      osc.start(sectionStartTime);
      console.log(`Oscillator started at ${sectionStartTime}`);
    });

    // Schedule cleanup
    setTimeout(() => {
      console.log("Stopping oscillators");
      oscillators.forEach(({ osc }) => {
        osc.stop(sectionEndTime);
        console.log(`Oscillator stopped at ${sectionEndTime}`);
      });
    }, section.duration * 1000);
  } catch (error) {
    console.error("Error in playCustomSound:", error);
  }
}

function createVoice(audioCtx, frequency, startTime, section) {
  const osc = audioCtx.createOscillator();
  const voiceGain = audioCtx.createGain();

  // Add slight detuning for richness
  const detune = Math.random() * 10 - 5; // ±5 cents
  osc.detune.setValueAtTime(detune, startTime);

  // Add subtle frequency modulation
  const modulator = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  modulator.frequency.setValueAtTime(6 + Math.random() * 2, startTime); // 6-8 Hz
  modGain.gain.setValueAtTime(frequency * 0.002, startTime); // Subtle modulation

  modulator.connect(modGain);
  modGain.connect(osc.frequency);
  modulator.start(startTime);

  return { osc, voiceGain, modulator };
}

function createEchoReverbImpulse(audioCtx) {
  const duration = 4.0; // Longer duration for more echo
  const decay = 3.0; // Slower decay
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioCtx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);

    // Add initial delay for echo effect
    let offset = 0;
    while (offset < length) {
      // Create multiple discrete reflections for more pronounced echo effect
      const echoStrength = Math.exp(-offset / (sampleRate * decay));
      const echoLength = sampleRate * 0.1; // 100ms echoes

      for (let i = 0; i < echoLength && offset + i < length; i++) {
        // Add a sharper attack to the echo pulses
        const attackShape = Math.pow(1 - i / echoLength, 0.5);
        const noise = (Math.random() * 2 - 1) * 0.3 + 0.7; // Less random, more consistent echo
        channelData[offset + i] = noise * echoStrength * attackShape;
      }

      // Space between echoes - larger spacing for more distinct echoes
      offset += sampleRate * 0.25; // 250ms between echoes (increased from 150ms)
    }
  }

  return impulse;
}

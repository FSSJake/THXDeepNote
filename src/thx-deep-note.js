import { createDownload } from "./ui/ui-controller.js";

export function generateDMajorChord(numVoices) {
  const D = 293.66;
  const Fsharp = 369.99;
  const A = 440.0;

  const notes = [
    D / 2,
    D,
    D * 2,
    D * 4, // D in different octaves
    Fsharp / 2,
    Fsharp,
    Fsharp * 2, // F# in different octaves
    A / 2,
    A,
    A * 2, // A in different octaves
  ];

  let chord = [];

  for (let i = 0; i < numVoices; i++) {
    const note = notes[i % notes.length];
    const variation = 1 + (Math.random() * 0.016 - 0.008);
    chord.push(note * variation);
  }

  return chord;
}

export async function createTHXBuffer(ctx, duration = 31) {
  if (!(ctx instanceof AudioContext || ctx instanceof OfflineAudioContext)) {
    throw new TypeError(
      "Invalid audio context provided. Please pass a valid AudioContext or OfflineAudioContext."
    );
  }

  const finalChord = generateDMajorChord(30);
  const centerFreq = 293.66 / 1.5;
  const initialFreqs = Array(30)
    .fill()
    .map((_, i) => centerFreq * (0.98 + i * 0.004));

  const masterGain = ctx.createGain();
  const lowpass = ctx.createBiquadFilter();
  const highpass = ctx.createBiquadFilter();

  // Set up filters
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(7000, 0);
  lowpass.Q.value = 1.7;

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(60, 0);
  highpass.Q.value = 1.9;

  // Connect chain
  masterGain.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(ctx.destination);
  masterGain.gain.value = 0.8;

  const oscillators = initialFreqs.map((startFreq, i) => {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    osc.type = "sawtooth";

    // Initial frequency
    osc.frequency.setValueAtTime(startFreq, 0);

    // Fade in
    voiceGain.gain.setValueAtTime(0, 0);
    voiceGain.gain.linearRampToValueAtTime(1.0 / 30, 0.2);

    // Fade out
    const fadeoutStart = duration - duration * 0.3;
    voiceGain.gain.setValueAtTime(1.0 / 30, fadeoutStart);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, duration);

    osc.connect(voiceGain);
    voiceGain.connect(masterGain);
    return { osc, voiceGain };
  });

  // Section timings
  const sections = [
    {
      duration: 10,
      mode: "random",
      range: [centerFreq * 0.7, centerFreq * 1.8],
    },
    { duration: 8, mode: "direct", range: [280, 450] },
    { duration: 13, mode: "direct" },
  ];

  let currentTime = 0;
  sections.forEach((section) => {
    const sectionEndTime = currentTime + section.duration;

    oscillators.forEach(({ osc }, i) => {
      const endFreq = finalChord[i % finalChord.length];

      if (section.mode === "direct") {
        osc.frequency.linearRampToValueAtTime(endFreq, sectionEndTime);
      } else if (section.mode === "random" && section.range) {
        const steps = 2;
        const stepTime = section.duration / steps;
        for (let step = 0; step < steps; step++) {
          const time = currentTime + step * stepTime;
          const [minFreq, maxFreq] = section.range;
          const randomFreq = minFreq + Math.random() * (maxFreq - minFreq);
          osc.frequency.linearRampToValueAtTime(randomFreq, time + stepTime);
        }
      }
    });

    currentTime = sectionEndTime;
  });

  // Start and stop all oscillators
  oscillators.forEach(({ osc }) => osc.start(0));
  oscillators.forEach(({ osc }) => osc.stop(duration));
}

export async function downloadTHXDeepNote() {
  const duration = 31;
  const sampleRate = 44100;

  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: sampleRate * duration,
    sampleRate: sampleRate,
  });

  await createTHXBuffer(offlineCtx, duration);
  return await offlineCtx.startRendering();
}

export function playTHXDeepNote(audioCtx) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return createTHXBuffer(audioCtx);
}

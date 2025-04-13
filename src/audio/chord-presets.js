const chordPresets = {
  C: [261.63, 329.63, 392.0], // C major
  D: [293.66, 369.99, 440.0], // D major
  E: [329.63, 415.3, 493.88], // E major
  F: [349.23, 440.0, 523.25], // F major
  G: [392.0, 493.88, 587.33], // G major
  A: [440.0, 554.37, 659.25], // A major
  B: [493.88, 622.25, 739.99], // B major
  THX: [
    146.83, // D3  - bass foundation
    220.0, // A3  - added warm mid
    293.66, // D4  - mid foundation
    369.99, // F#4 - mid harmony
    440.0, // A4  - mid harmony
    587.33, // D5  - softened high
    739.99, // F#5 - softened high (replaces 880.0)
  ],
};

export default chordPresets;

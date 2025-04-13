export class EQController {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.highpass = audioCtx.createBiquadFilter();
    this.lowpass = audioCtx.createBiquadFilter();

    this.highpass.type = "highpass";
    this.lowpass.type = "lowpass";

    this.highpass.connect(this.lowpass);
  }

  setHighPass(frequency, time = null) {
    const safeFreq = Math.max(20, Math.min(frequency, 20000));
    if (time === null) {
      // Immediate change
      this.highpass.frequency.setValueAtTime(
        safeFreq,
        this.audioCtx.currentTime
      );
      this.highpass.Q.setValueAtTime(0.7, this.audioCtx.currentTime);
    } else {
      // Scheduled change
      this.highpass.frequency.linearRampToValueAtTime(safeFreq, time);
      this.highpass.Q.setValueAtTime(0.7, time);
    }
  }

  setLowPass(frequency, time = null) {
    const safeFreq = Math.max(20, Math.min(frequency, 20000));
    if (time === null) {
      // Immediate change
      this.lowpass.frequency.setValueAtTime(
        safeFreq,
        this.audioCtx.currentTime
      );
      this.lowpass.Q.setValueAtTime(0.7, this.audioCtx.currentTime);
    } else {
      // Scheduled change
      this.lowpass.frequency.linearRampToValueAtTime(safeFreq, time);
      this.lowpass.Q.setValueAtTime(0.7, time);
    }
  }

  connectInput(node) {
    node.connect(this.highpass);
  }

  connectOutput(node) {
    this.lowpass.connect(node);
  }
}

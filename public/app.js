class StepSequencer {
  constructor(containerId, steps = 16) {
    this.container = document.getElementById(containerId);
    this.steps = Array(steps).fill(false);
    this.stepEls = [];
    this.createUI();
  }
  createUI() {
    for (let i = 0; i < this.steps.length; i++) {
      const div = document.createElement('div');
      div.className = 'step';
      div.addEventListener('click', () => {
        this.steps[i] = !this.steps[i];
        div.classList.toggle('active', this.steps[i]);
      });
      this.container.appendChild(div);
      this.stepEls.push(div);
    }
  }
  getStep(index) {
    return this.steps[index % this.steps.length];
  }
  randomize() {
    this.steps = this.steps.map(() => Math.random() > 0.5);
    this.stepEls.forEach((el, i) => {
      el.classList.toggle('active', this.steps[i]);
    });
  }
}

class GrooveBox {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.tempo = 120;
    this.currentStep = 0;
    this.isPlaying = false;
    this.setupModules();
    this.bindUI();
  }
  setupModules() {
    this.drumSeq = new StepSequencer('drumSteps');
    this.ms10Seq = new StepSequencer('ms10Steps');
    this.cs01Seq = new StepSequencer('cs01Steps');
    this.ms10Seq.randomize();
    this.cs01Seq.randomize();
    this.reverb = this.createReverb();
    this.delay = this.createDelay();
  }
  bindUI() {
    document.getElementById('start').addEventListener('click', () => this.start());
    document.getElementById('stop').addEventListener('click', () => this.stop());
  }
  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStep();
  }
  stop() {
    this.isPlaying = false;
  }
  nextStep() {
    if (!this.isPlaying) return;
    this.playStep(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 16;
    setTimeout(() => this.nextStep(), (60 / this.tempo) * 1000 / 4);
  }
  playStep(step) {
    if (this.drumSeq.getStep(step)) this.triggerKick();
    if (this.ms10Seq.getStep(step)) this.triggerMS10();
    if (this.cs01Seq.getStep(step)) this.triggerCS01();
  }
  triggerKick() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(this.reverb).connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }
  triggerMS10() {
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 220 + Math.random() * 440;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);
    osc.connect(filter).connect(gain).connect(this.delay).connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }
  triggerCS01() {
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 110 + Math.random() * 110;
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, this.audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
    osc.connect(filter).connect(gain).connect(this.delay).connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.6);
  }
  createReverb() {
    const convolver = this.audioCtx.createConvolver();
    const rate = this.audioCtx.sampleRate;
    const length = rate * 2;
    const impulse = this.audioCtx.createBuffer(2, length, rate);
    for (let i = 0; i < 2; i++) {
      const channel = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }
  createDelay() {
    const delay = this.audioCtx.createDelay();
    const feedback = this.audioCtx.createGain();
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    delay.connect(feedback).connect(delay);
    return delay;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const box = new GrooveBox();
});

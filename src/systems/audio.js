/* ==========================================
   Cozy Web Audio API Synthesizer
   ========================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmVolume = 0.7; // default 70%
    this.sfxVolume = 0.8; // default 80%
    this.soundEnabled = true;
    this.bgmInterval = null;
    this.windSource = null;
    this.windGain = null;
    this.currentBgmType = null; // null, 1 (meadow), 2 (flute), 3 (full)
    this.step = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Soft master volume
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.soundEnabled ? 0.3 : 0, this.ctx.currentTime);
    }
    return this.soundEnabled;
  }

  setMusicVolume(val) {
    this.bgmVolume = val;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // Synthesize a simple synth plink / typewriter tick
  playTypewriter() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Cozy pop sound for UI or notifications
  playPop() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    // Quick sweep upwards
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Sparkly chime sound for collecting / completing task
  playChime() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  // Bridge snap sound (simulated snap using noise block)
  playBridgeSnap() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Create white noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it wooden and snap-like
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.15);

    // Add a secondary low chime click
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    oscGain.gain.setValueAtTime(0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Heart crack sound (crystal shattering sound)
  playHeartCrack() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Two high frequency oscillators sweeping down rapidly
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2000, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1800, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // Firework explosion sound
  playExplode() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.6);

    // High frequency sparkle tails
    setTimeout(() => {
      if (this.soundEnabled) this.playChime();
    }, 100);
  }

  // Scrapbook page flip
  playPageFlip() {
    if (!this.soundEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.12);
  }

  // Synthesize soft wind sound for intro and snowy level
  startWind() {
    if (this.windSource || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    // Filter to simulate hollow wind sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(3.0, now);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, now);
    this.windGain.gain.linearRampToValueAtTime(0.12, now + 1.0); // Fade in

    this.windSource.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);

    this.windSource.start(now);

    // Slowly modulate wind frequency for whistling effect
    this.windModulator = setInterval(() => {
      if (this.ctx && this.windSource) {
        const modTime = this.ctx.currentTime;
        const targetFreq = 200 + Math.sin(modTime * 1.5) * 80;
        filter.frequency.linearRampToValueAtTime(targetFreq, modTime + 0.4);
      }
    }, 400);
  }

  stopWind() {
    if (!this.windSource || !this.ctx) return;
    clearInterval(this.windModulator);
    
    const now = this.ctx.currentTime;
    try {
      this.windGain.gain.cancelScheduledValues(now);
      this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
      this.windGain.gain.linearRampToValueAtTime(0, now + 0.8);
      
      const src = this.windSource;
      setTimeout(() => {
        try { src.stop(); } catch(e){}
      }, 900);
    } catch(e){}
    
    this.windSource = null;
    this.windGain = null;
  }

  // Start cozy procedural background music sequencer
  // BGM Type:
  // 1: Blossom Meadow cozy theme (triangle wave piano arpeggios, C-F-Am-G chords)
  // 2: Adds a gentle whistle flute overlay
  // 3: Orchestral warm bass, bell chimes, and percussion ticks
  startBGM(type = 1) {
    this.resume();
    if (this.currentBgmType === type && this.bgmInterval) return;
    
    this.stopBGM();
    this.currentBgmType = type;
    
    const tempo = 84; // Cozy speed
    const stepDuration = 60 / tempo / 2; // Eighth notes (approx 0.35s)
    
    // Scale notes: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5 (Pentatonic major)
    const C_CHORD = [130.81, 261.63, 329.63, 392.00, 523.25, 659.25]; // C3, C4, E4, G4, C5, E5
    const F_CHORD = [174.61, 349.23, 440.00, 523.25, 698.46, 880.00]; // F3, F4, A4, C5, F5, A5
    const AM_CHORD = [110.00, 220.00, 293.66, 440.00, 587.33, 698.46]; // A2, A3, D4, A4, D5, F5 (A min/d7 shape)
    const G_CHORD = [196.00, 392.00, 493.88, 587.33, 783.99, 987.77]; // G3, G4, B4, D5, G5, B5

    const chords = [
      C_CHORD, C_CHORD, F_CHORD, F_CHORD,
      AM_CHORD, AM_CHORD, G_CHORD, G_CHORD
    ];

    const playSequenceStep = () => {
      if (!this.soundEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chordIdx = Math.floor(this.step / 8) % chords.length;
      const currentChord = chords[chordIdx];
      
      const stepInMeasure = this.step % 8;
      
      // Tier 1: Arpeggiator (Piano-like triangle waves)
      let noteIndex = 0;
      if (stepInMeasure === 0) noteIndex = 0; // Root bass
      else if (stepInMeasure === 1) noteIndex = 3;
      else if (stepInMeasure === 2) noteIndex = 2;
      else if (stepInMeasure === 3) noteIndex = 4;
      else if (stepInMeasure === 4) noteIndex = 1;
      else if (stepInMeasure === 5) noteIndex = 3;
      else if (stepInMeasure === 6) noteIndex = 2;
      else if (stepInMeasure === 7) noteIndex = 5;

      const baseFreq = currentChord[noteIndex];
      this.playNote(baseFreq, 'triangle', 0.1, stepDuration * 1.5, now);

      // Tier 2: Adds a floating Flute theme (sine waves playing slow melodies)
      if (type >= 2 && stepInMeasure % 2 === 0) {
        // Melodic overlay based on pentatonic intervals
        let fluteNote = null;
        if (chordIdx === 0 || chordIdx === 1) { // C Major
          fluteNote = [523.25, 587.33, 659.25, 783.99][stepInMeasure / 2];
        } else if (chordIdx === 2 || chordIdx === 3) { // F Major
          fluteNote = [523.25, 698.46, 783.99, 880.00][stepInMeasure / 2];
        } else if (chordIdx === 4 || chordIdx === 5) { // A Minor
          fluteNote = [440.00, 523.25, 587.33, 659.25][stepInMeasure / 2];
        } else { // G Major
          fluteNote = [493.88, 587.33, 783.99, 987.77][stepInMeasure / 2];
        }
        
        // Soft vibrato sine flute
        if (fluteNote && Math.random() > 0.3) {
          this.playFluteNote(fluteNote, 0.05, stepDuration * 2.2, now);
        }
      }

      // Tier 3: Adds Cello bass pads, bell sparkles, and percussion ticks
      if (type >= 3) {
        // Deep Cello Bass pad on downbeats
        if (stepInMeasure === 0) {
          const bassFreq = currentChord[0] / 2; // Octave lower bass
          this.playNote(bassFreq, 'sine', 0.15, stepDuration * 7.5, now);
        }

        // Bell sparkles (high sine/triangle) on random offbeats
        if (stepInMeasure === 3 || stepInMeasure === 7) {
          if (Math.random() > 0.4) {
            const bellFreq = currentChord[5] * 2; // Octave higher
            this.playNote(bellFreq, 'sine', 0.03, 0.8, now, true); // Bell envelope
          }
        }

        // Soft percussion ticks (high-passed noise burst)
        if (stepInMeasure % 2 === 1) {
          this.playSoftTick(now);
        }
      }

      this.step++;
    };

    // Schedule next beats
    this.bgmInterval = setInterval(playSequenceStep, stepDuration * 1000);
  }

  // Play a standard synth note
  playNote(frequency, type, volume, duration, time, isBell = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);

    gainNode.connect(this.bgmGain);
    osc.connect(gainNode);

    gainNode.gain.setValueAtTime(0, time);
    // Smooth attack
    gainNode.gain.linearRampToValueAtTime(volume, time + 0.05);

    if (isBell) {
      // Bell envelope (quick decay, long ring)
      gainNode.gain.setValueAtTime(volume, time + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else {
      // Standard instrument envelope
      gainNode.gain.setValueAtTime(volume, time + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    }

    osc.start(time);
    osc.stop(time + duration);
  }

  // Play a flute-like note (sine + vibrato + slide)
  playFluteNote(frequency, volume, duration, time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    // Add LFO for vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    lfo.frequency.value = 5.5; // Vibrato speed (Hz)
    lfoGain.gain.value = 4.0;  // Vibrato depth (Hz)

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, time);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    gainNode.connect(this.bgmGain);
    osc.connect(gainNode);

    // Warm woodwind envelope
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + 0.15); // slower attack
    gainNode.gain.setValueAtTime(volume, time + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, time + duration);

    lfo.start(time);
    osc.start(time);
    
    lfo.stop(time + duration);
    osc.stop(time + duration);
  }

  // Play a soft high-hat click
  playSoftTick(time) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.02; // Very short
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.02);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgmType = null;
  }
}

// Export single audio system
export const Audio = new AudioEngine();
export default Audio;

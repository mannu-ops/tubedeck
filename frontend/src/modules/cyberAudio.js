// Audio Engine - Completely Disabled as requested
class HardwareAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
  }

  init() {}

  isMuted() {
    return true;
  }

  toggleMute() {
    return true;
  }

  play() {
    // Zero audio playback as requested by user
  }
}

export const hardwareAudio = new HardwareAudioEngine();
export const cyberAudio = hardwareAudio;

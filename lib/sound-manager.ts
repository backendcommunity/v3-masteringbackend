"use client";

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled = true;
  private masterVolume = 0.7;

  constructor() {
    // Check if audio is supported and user hasn't disabled it
    if (typeof window !== "undefined" && "Audio" in window) {
      this.preloadSounds();
      this.checkUserPreferences();
    }
  }

  private checkUserPreferences() {
    const raw = localStorage.getItem("mb_soundEnabled");
    if (raw !== null) {
      this.isEnabled = JSON.parse(raw);
    }
  }

  private preloadSounds() {
    const soundFiles = [
      // {
      //   name: "celebration",
      //   src: "/sounds/celebration.mp3",
      // },
      // { name: "success", src: "/sounds/success.mp3" },
      { name: "enrollment", src: "/sounds/enrollment.mp3" },
      { name: "achievement", src: "/sounds/achievement.mp3" },
    ];

    soundFiles.forEach(({ name, src }) => {
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.volume = this.masterVolume;

        // Try primary format first
        audio.src = src;
        audio.addEventListener("error", (e) => {
          // Fallback to alternative format if available

          console.log(e);
        });

        this.sounds.set(name, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${name}`, error);
      }
    });
  }

  play(soundName: string, volume?: number) {
    if (!this.isEnabled) return;

    const sound = this.sounds.get(soundName);
    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.volume = (volume ?? this.masterVolume) * this.masterVolume;

      // Handle autoplay restrictions
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`Autoplay prevented for sound: ${soundName}`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem("mb_soundEnabled", JSON.stringify(enabled));
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    // Update all existing sounds
    this.sounds.forEach((sound) => {
      sound.volume = this.masterVolume;
    });
  }

  isAudioEnabled() {
    return this.isEnabled;
  }

  getMasterVolume() {
    return this.masterVolume;
  }
}

export const soundManager = new SoundManager();

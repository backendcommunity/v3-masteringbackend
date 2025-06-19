"use client"

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private isEnabled = true
  private masterVolume = 0.7

  constructor() {
    // Check if we're in browser environment
    if (typeof window !== "undefined" && "Audio" in window) {
      this.preloadSounds()
      this.checkUserPreferences()
    }
  }

  private checkUserPreferences() {
    try {
      const soundEnabled = localStorage.getItem("soundEnabled")
      if (soundEnabled !== null) {
        this.isEnabled = JSON.parse(soundEnabled)
      }
    } catch (error) {
      console.warn("Failed to load sound preferences:", error)
    }
  }

  private preloadSounds() {
    const soundFiles = [
      { name: "celebration", src: "/sounds/celebration.mp3" },
      { name: "success", src: "/sounds/success.mp3" },
      { name: "achievement", src: "/sounds/achievement.mp3" },
    ]

    soundFiles.forEach(({ name, src }) => {
      try {
        const audio = new Audio()
        audio.preload = "auto"
        audio.volume = this.masterVolume
        audio.src = src

        // Handle loading errors gracefully
        audio.addEventListener("error", (e) => {
          console.warn(`Failed to load sound: ${name}`, e)
        })

        this.sounds.set(name, audio)
      } catch (error) {
        console.warn(`Failed to create audio for: ${name}`, error)
      }
    })
  }

  play(soundName: string, volume?: number): void {
    if (!this.isEnabled) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      try {
        sound.currentTime = 0
        sound.volume = (volume ?? this.masterVolume) * this.masterVolume

        // Handle autoplay restrictions
        const playPromise = sound.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Autoplay was prevented, which is normal behavior
            console.debug(`Autoplay prevented for sound: ${soundName}`, error)
          })
        }
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error)
      }
    } else {
      console.warn(`Sound not found: ${soundName}`)
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    try {
      localStorage.setItem("soundEnabled", JSON.stringify(enabled))
    } catch (error) {
      console.warn("Failed to save sound preference:", error)
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    // Update all existing sounds
    this.sounds.forEach((sound) => {
      sound.volume = this.masterVolume
    })
  }

  isAudioEnabled(): boolean {
    return this.isEnabled
  }

  getMasterVolume(): number {
    return this.masterVolume
  }
}

export const soundManager = new SoundManager()

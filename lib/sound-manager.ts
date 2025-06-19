"use client"

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private isEnabled = true
  private masterVolume = 0.7

  constructor() {
    // Check if audio is supported and user hasn't disabled it
    if (typeof window !== "undefined" && "Audio" in window) {
      this.preloadSounds()
      this.checkUserPreferences()
    }
  }

  private checkUserPreferences() {
    const soundEnabled = localStorage.getItem("soundEnabled")
    if (soundEnabled !== null) {
      this.isEnabled = JSON.parse(soundEnabled)
    }
  }

  private preloadSounds() {
    const soundFiles = [
      { name: "celebration", src: "/sounds/celebration.mp3", fallback: "/sounds/celebration.wav" },
      { name: "success", src: "/sounds/success.mp3" },
      { name: "achievement", src: "/sounds/achievement.mp3" },
    ]

    soundFiles.forEach(({ name, src, fallback }) => {
      try {
        const audio = new Audio()
        audio.preload = "auto"
        audio.volume = this.masterVolume

        // Try primary format first
        audio.src = src
        audio.addEventListener("error", () => {
          // Fallback to alternative format if available
          if (fallback) {
            audio.src = fallback
          }
        })

        this.sounds.set(name, audio)
      } catch (error) {
        console.warn(`Failed to preload sound: ${name}`, error)
      }
    })
  }

  play(soundName: string, volume?: number) {
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
            console.warn(`Autoplay prevented for sound: ${soundName}`, error)
          })
        }
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    localStorage.setItem("soundEnabled", JSON.stringify(enabled))
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    // Update all existing sounds
    this.sounds.forEach((sound) => {
      sound.volume = this.masterVolume
    })
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  getMasterVolume() {
    return this.masterVolume
  }
}

export const soundManager = new SoundManager()

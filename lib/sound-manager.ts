"use client"

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private isEnabled = true

  constructor() {
    // Check if audio is supported
    if (typeof window !== "undefined" && "Audio" in window) {
      this.preloadSounds()
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
        const audio = new Audio(src)
        audio.preload = "auto"
        audio.volume = 0.6
        this.sounds.set(name, audio)
      } catch (error) {
        console.warn(`Failed to preload sound: ${name}`, error)
      }
    })
  }

  play(soundName: string, volume = 0.6) {
    if (!this.isEnabled) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      try {
        sound.currentTime = 0
        sound.volume = volume
        sound.play().catch((error) => {
          console.warn(`Failed to play sound: ${soundName}`, error)
        })
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  isAudioEnabled() {
    return this.isEnabled
  }
}

export const soundManager = new SoundManager()

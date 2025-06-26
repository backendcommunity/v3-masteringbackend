"use client"

interface SoundFile {
  name: string
  src: string
  audio?: HTMLAudioElement
}

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private isEnabled = true
  private masterVolume = 0.7
  private isInitialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    try {
      this.checkUserPreferences()
      await this.preloadSounds()
      this.isInitialized = true
    } catch (error) {
      console.warn("Failed to initialize sound manager:", error)
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

  private async preloadSounds() {
    const soundFiles: SoundFile[] = [
      { name: "celebration", src: "/sounds/celebration.mp3" },
      { name: "success", src: "/sounds/success.mp3" },
      { name: "achievement", src: "/sounds/achievement.mp3" },
    ]

    for (const soundFile of soundFiles) {
      try {
        const audio = new Audio()
        audio.preload = "metadata"
        audio.volume = this.masterVolume
        audio.src = soundFile.src

        // Wait for the audio to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading ${soundFile.name}`))
          }, 5000)

          audio.addEventListener(
            "canplaythrough",
            () => {
              clearTimeout(timeout)
              resolve()
            },
            { once: true },
          )

          audio.addEventListener(
            "error",
            (e) => {
              clearTimeout(timeout)
              console.warn(`Failed to load sound: ${soundFile.name}`, e)
              resolve() // Don't reject, just continue without this sound
            },
            { once: true },
          )
        })

        this.sounds.set(soundFile.name, audio)
      } catch (error) {
        console.warn(`Failed to preload sound: ${soundFile.name}`, error)
      }
    }
  }

  play(soundName: string, volume = 0.7): void {
    if (!this.isEnabled || !this.isInitialized) return

    try {
      const sound = this.sounds.get(soundName)
      if (sound) {
        sound.currentTime = 0
        sound.volume = Math.min(volume * this.masterVolume, 1)

        const playPromise = sound.play()
        if (playPromise) {
          playPromise.catch((error) => {
            // This is expected behavior for autoplay restrictions
            console.debug(`Autoplay prevented for sound: ${soundName}`)
          })
        }
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error)
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

  getSoundNames(): string[] {
    return Array.from(this.sounds.keys())
  }
}

export const soundManager = new SoundManager()

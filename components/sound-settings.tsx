"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play } from "lucide-react"
import { soundManager } from "@/lib/sound-manager"

export function SoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isAudioEnabled())
  const [volume, setVolume] = useState(soundManager.getMasterVolume() * 100)

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    soundManager.setMasterVolume(volume / 100)
  }, [volume])

  const testSound = (soundName: string) => {
    soundManager.play(soundName)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sound Settings
        </CardTitle>
        <CardDescription>Configure celebration sounds and audio preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Sounds</div>
            <div className="text-xs text-muted-foreground">Play celebration sounds for achievements and milestones</div>
          </div>
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </div>

        {soundEnabled && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Master Volume</div>
                <div className="text-xs text-muted-foreground">{volume}%</div>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Test Sounds</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound("celebration")}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Enrollment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound("success")}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Success
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound("achievement")}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Achievement
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

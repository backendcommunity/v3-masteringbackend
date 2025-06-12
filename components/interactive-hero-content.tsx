"use client"

import { useState, useEffect } from "react"
import { Play, ArrowRight, Sparkles } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export function InteractiveHeroContent() {
  const [currentWord, setCurrentWord] = useState(0)
  const words = ["Backend", "Career", "Future", "Success"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative z-20 text-center max-w-4xl mx-auto">
      {/* Brand Introduction */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <BrandLogo size="lg" showText={false} variant="white" />
        <div className="glass-card px-4 py-2 rounded-full">
          <span className="text-white font-semibold">Masteringbackend</span>
        </div>
      </div>

      {/* Main Headline */}
      <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
        Transform Your
        <br />
        <span className="relative inline-block">
          <span
            className="bg-gradient-to-r from-[#F4E04D] to-[#13AECE] bg-clip-text text-transparent transition-all duration-500"
            key={currentWord}
          >
            {words[currentWord]}
          </span>
          <div className="absolute -inset-2 bg-gradient-to-r from-[#F4E04D]/20 to-[#13AECE]/20 blur-xl rounded-lg -z-10"></div>
        </span>
      </h1>

      {/* Subtitle with Typewriter Effect */}
      <div className="glass-card p-6 rounded-2xl mb-8 max-w-3xl mx-auto">
        <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
          We don't just sell courses. We transform careers through our proven
          <span className="text-[#F4E04D] font-semibold"> Learn → Build → Grow </span>
          methodology and land you your dream backend engineering job.
        </p>
      </div>

      {/* Interactive Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#F4E04D] transition-colors">10K+</div>
          <div className="text-blue-200 text-sm">Careers Transformed</div>
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
            <div className="bg-[#F4E04D] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#13AECE] transition-colors">95%</div>
          <div className="text-blue-200 text-sm">Job Placement Rate</div>
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
            <div className="bg-[#13AECE] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#90EE90] transition-colors">500+</div>
          <div className="text-blue-200 text-sm">Real Projects</div>
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
            <div className="bg-[#90EE90] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#F47C7C] transition-colors">24/7</div>
          <div className="text-blue-200 text-sm">Community Support</div>
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
            <div className="bg-[#F47C7C] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button className="group relative overflow-hidden glass-card px-8 py-4 rounded-xl text-lg font-semibold text-white hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4E04D] to-[#13AECE] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <span className="relative flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Start Your Transformation</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </button>

        <button className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors px-8 py-4 group">
          <div className="relative">
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300"></div>
          </div>
          <span>Watch Success Stories</span>
        </button>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-blue-200 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>30-day money-back guarantee</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>No long-term contracts</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}

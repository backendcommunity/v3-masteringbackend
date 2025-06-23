"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Code2,
  Users,
  Trophy,
  Briefcase,
  CheckCircle,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

export function FloatingCareerElements() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Terminal Window - Top Left */}
      <div
        className="absolute top-20 left-16 glass-card p-4 rounded-xl pointer-events-auto transform hover:scale-105 transition-all duration-300"
        style={{
          transform: `translate(${mousePosition.x * 0.01}px, ${
            mousePosition.y * 0.01
          }px)`,
          animation: "float 6s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>
        <div className="font-mono text-xs text-green-400">
          <div>$ npm start</div>
          <div className="text-blue-300">Server running on port 3000</div>
          <div className="text-yellow-300">✓ Database connected</div>
        </div>
      </div>

      {/* Career Progress - Top Right */}
      <div
        className="absolute top-32 right-20 glass-card p-4 rounded-xl pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * -0.015}px, ${
            mousePosition.y * 0.02
          }px)`,
          animationDelay: "2s",
          animation: "float 8s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[#13AECE]" />
          <span className="text-sm font-semibold text-white">
            Career Growth
          </span>
        </div>
        <div className="text-xs text-blue-200">
          Junior → Senior in 18 months
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div className="bg-gradient-to-r from-[#13AECE] to-[#F4E04D] h-2 rounded-full w-4/5"></div>
        </div>
      </div>

      {/* User Avatar with Achievement */}
      <div
        className="absolute top-40 left-32 glass-card p-3 rounded-full pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${
            mousePosition.y * -0.01
          }px)`,
          animationDelay: "1s",
          animation: "float 7s ease-in-out infinite",
        }}
      >
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-[#13aece] to-[#13AECE] rounded-full flex items-center justify-center">
            <span className="text-white font-bold">SA</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F4E04D] rounded-full flex items-center justify-center">
            <Trophy className="w-3 h-3 text-[#13aece]" />
          </div>
        </div>
      </div>

      {/* Code Snippet - Left Side */}
      <div
        className="absolute top-1/2 left-8 glass-card p-4 rounded-xl pointer-events-auto max-w-xs"
        style={{
          transform: `translate(${mousePosition.x * 0.008}px, ${
            mousePosition.y * 0.012
          }px)`,
          animationDelay: "3s",
          animation: "float 9s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <Code2 className="w-4 h-4 text-[#13AECE]" />
          <span className="text-sm font-semibold text-white">Live Project</span>
        </div>
        <div className="font-mono text-xs">
          <div className="text-purple-300">const api = express()</div>
          <div className="text-green-300">api.use('/auth', routes)</div>
          <div className="text-yellow-300">// Scalable & secure</div>
        </div>
      </div>

      {/* Database Connection - Right Side */}
      <div
        className="absolute top-1/2 right-12 glass-card p-4 rounded-xl pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * -0.01}px, ${
            mousePosition.y * 0.015
          }px)`,
          animationDelay: "4s",
          animation: "float 10s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <Database className="w-4 h-4 text-[#F4E04D]" />
          <span className="text-sm font-semibold text-white">
            Database Mastery
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span className="text-xs text-blue-200">MongoDB Expert</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span className="text-xs text-blue-200">PostgreSQL Pro</span>
        </div>
      </div>

      {/* Interview Success */}
      <div
        className="absolute bottom-40 left-20 glass-card p-4 rounded-xl pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * 0.012}px, ${
            mousePosition.y * -0.008
          }px)`,
          animationDelay: "5s",
          animation: "float 11s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <Briefcase className="w-4 h-4 text-[#90EE90]" />
          <span className="text-sm font-semibold text-white">
            Interview Ready
          </span>
        </div>
        <div className="text-xs text-green-300">95% Success Rate</div>
        <div className="flex space-x-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-3 h-3 fill-[#F4E04D] text-[#F4E04D]"
            />
          ))}
        </div>
      </div>

      {/* Community Badge */}
      <div
        className="absolute bottom-32 right-24 glass-card p-3 rounded-xl pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * -0.008}px, ${
            mousePosition.y * 0.01
          }px)`,
          animationDelay: "6s",
          animation: "float 12s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-[#13AECE]" />
          <span className="text-sm font-semibold text-white">50K+ Devs</span>
        </div>
        <div className="text-xs text-blue-200">Active Community</div>
      </div>

      {/* Tech Stack Icons */}
      <div
        className="absolute top-60 right-40 flex space-x-2"
        style={{
          transform: `translate(${mousePosition.x * 0.005}px, ${
            mousePosition.y * -0.005
          }px)`,
          animationDelay: "7s",
          animation: "float 8s ease-in-out infinite",
        }}
      >
        <div className="glass-card p-2 rounded-lg">
          <div className="w-8 h-8 bg-[#13aece] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">JS</span>
          </div>
        </div>
        <div className="glass-card p-2 rounded-lg">
          <div className="w-8 h-8 bg-[#13AECE] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">Py</span>
          </div>
        </div>
        <div className="glass-card p-2 rounded-lg">
          <div className="w-8 h-8 bg-[#F47C7C] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">Go</span>
          </div>
        </div>
      </div>

      {/* Project Completion */}
      <div
        className="absolute bottom-60 left-40 glass-card p-3 rounded-xl pointer-events-auto"
        style={{
          transform: `translate(${mousePosition.x * 0.007}px, ${
            mousePosition.y * 0.007
          }px)`,
          animationDelay: "8s",
          animation: "float 9s ease-in-out infinite",
        }}
      >
        <div className="flex items-center space-x-2 mb-1">
          <Zap className="w-4 h-4 text-[#F4E04D]" />
          <span className="text-sm font-semibold text-white">
            Project Complete
          </span>
        </div>
        <div className="text-xs text-blue-200">E-commerce API</div>
        <div className="text-xs text-green-300">+500 XP earned</div>
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#13AECE] rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

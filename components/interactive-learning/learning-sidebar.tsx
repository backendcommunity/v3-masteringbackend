'use client';

import React, { useState } from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Hammer, TrendingUp, Menu, X, Home, Target, Settings, BarChart3 } from 'lucide-react';
import { LearningPhase } from '@/lib/learning-path-generator';
import Link from 'next/link';

const PHASE_COLORS: Record<LearningPhase, { icon: React.ReactNode; color: string; bgColor: string }> = {
  learn: {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  build: {
    icon: <Hammer className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  grow: {
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
};

export function LearningSidebar() {
  const { learningPath, getPhaseProgress, resetOnboarding } = useLearning();
  const [isOpen, setIsOpen] = useState(false);

  if (!learningPath) return null;

  const phases: LearningPhase[] = ['learn', 'build', 'grow'];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 overflow-y-auto transition-transform duration-300 lg:translate-x-0 z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Learning path navigation"
      >
        {/* Close Button for Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-white hover:bg-gray-700 lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="space-y-8 mt-8">
          {/* Logo/Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              <h1 className="font-bold text-lg">Learning Path</h1>
            </div>
            <p className="text-sm text-gray-400">{learningPath.goal}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link href="/interactive-learning">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-200 hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/interactive-learning/stats">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-200 hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistics
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-200 hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <Home className="w-4 h-4 mr-2" />
                Main Hub
              </Button>
            </Link>
          </nav>

          {/* Phases */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Learning Phases
            </h3>

            <div className="space-y-2">
              {phases.map((phase) => {
                const progress = getPhaseProgress(phase);
                const phaseInfo = PHASE_COLORS[phase];
                const isCurrentPhase = phase === learningPath.currentPhase;
                const isCompleted = progress.completed === progress.total;

                return (
                  <button
                    key={phase}
                    onClick={() => setIsOpen(false)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      isCurrentPhase
                        ? 'bg-blue-600 border-blue-400 shadow-lg'
                        : isCompleted
                          ? 'bg-green-600 border-green-400'
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{phaseInfo.icon}</span>
                      <span className="font-semibold capitalize text-sm">{phase}</span>
                      {isCurrentPhase && (
                        <Badge className="bg-yellow-400 text-gray-900 ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-white text-green-600 ml-auto text-xs">
                          Done
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-200">
                      {progress.completed}/{progress.total} items
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overall Stats */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Overall Progress
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Completion</span>
                <span className="font-bold text-blue-400">{learningPath.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${learningPath.progress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {learningPath.progress.completed} of {learningPath.progress.total} completed
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              className="w-full text-gray-200 border-gray-600 hover:bg-gray-700"
              onClick={() => {
                resetOnboarding();
                setIsOpen(false);
              }}
            >
              Start New Path
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

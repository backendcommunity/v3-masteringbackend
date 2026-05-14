'use client';

import React from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, BookOpen, Hammer, TrendingUp, Star } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  requirement: string;
}

export function AchievementsPanel() {
  const { learningPath } = useLearning();

  if (!learningPath) return null;

  // Generate achievements based on progress
  const achievements: Achievement[] = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: <BookOpen className="w-6 h-6" />,
      unlocked: learningPath.items.some((item) => item.type === 'lesson' && item.completed),
      requirement: 'Complete 1 lesson',
    },
    {
      id: 'first-project',
      title: 'Builder',
      description: 'Complete your first project',
      icon: <Hammer className="w-6 h-6" />,
      unlocked: learningPath.items.some((item) => item.type === 'project' && item.completed),
      requirement: 'Complete 1 project',
    },
    {
      id: 'learn-phase',
      title: 'Learning Master',
      description: 'Complete the Learn phase',
      icon: <Star className="w-6 h-6" />,
      unlocked: learningPath.items.filter((item) => item.phase === 'learn').every((item) => item.completed),
      requirement: 'Complete all Learn phase items',
    },
    {
      id: 'build-phase',
      title: 'Craftsman',
      description: 'Complete the Build phase',
      icon: <Hammer className="w-6 h-6" />,
      unlocked: learningPath.items.filter((item) => item.phase === 'build').every((item) => item.completed),
      requirement: 'Complete all Build phase items',
    },
    {
      id: 'grow-phase',
      title: 'Expert',
      description: 'Complete the Grow phase',
      icon: <TrendingUp className="w-6 h-6" />,
      unlocked: learningPath.items.filter((item) => item.phase === 'grow').every((item) => item.completed),
      requirement: 'Complete all Grow phase items',
    },
    {
      id: 'halfway',
      title: 'Halfway There',
      description: '50% of your path completed',
      icon: <Zap className="w-6 h-6" />,
      unlocked: learningPath.progress.percentage >= 50,
      requirement: 'Reach 50% completion',
    },
    {
      id: 'ninety-percent',
      title: 'Nearly Done',
      description: '90% of your path completed',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: learningPath.progress.percentage >= 90,
      requirement: 'Reach 90% completion',
    },
    {
      id: 'path-complete',
      title: 'Master Learner',
      description: 'Complete your entire learning path',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: learningPath.progress.percentage === 100,
      requirement: 'Reach 100% completion',
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Achievements
            </CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">
              {unlockedCount}/{achievements.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-2xl ${
                      achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{achievement.requirement}</p>
                  </div>
                  {achievement.unlocked && (
                    <Badge className="bg-green-600 text-white">Unlocked</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

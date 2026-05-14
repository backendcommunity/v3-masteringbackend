'use client';

import React from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Hammer, TrendingUp, CheckCircle2, Circle, Lock } from 'lucide-react';
import { LearningPhase, LearningItem } from '@/lib/learning-path-generator';

const PHASE_INFO: Record<LearningPhase, { title: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  learn: {
    title: 'Learn',
    color: 'text-blue-600',
    icon: <BookOpen className="w-6 h-6" />,
    bgColor: 'bg-blue-50 border-blue-200',
  },
  build: {
    title: 'Build',
    color: 'text-purple-600',
    icon: <Hammer className="w-6 h-6" />,
    bgColor: 'bg-purple-50 border-purple-200',
  },
  grow: {
    title: 'Grow',
    color: 'text-green-600',
    icon: <TrendingUp className="w-6 h-6" />,
    bgColor: 'bg-green-50 border-green-200',
  },
};

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  lesson: <BookOpen className="w-3 h-3" />,
  project: <Hammer className="w-3 h-3" />,
  challenge: <TrendingUp className="w-3 h-3" />,
};

export function LearningPathRoadmap() {
  const { learningPath } = useLearning();

  if (!learningPath) return null;

  const phases: LearningPhase[] = ['learn', 'build', 'grow'];

  return (
    <div className="space-y-6">
      {phases.map((phase, phaseIndex) => {
        const phaseItems = learningPath.items.filter((item) => item.phase === phase);
        const phaseInfo = PHASE_INFO[phase];
        const isCurrentPhase = phase === learningPath.currentPhase;
        const isPastPhase = phases.indexOf(phase) < phases.indexOf(learningPath.currentPhase);
        const completedInPhase = phaseItems.filter((item) => item.completed).length;
        const phaseProgress = (completedInPhase / phaseItems.length) * 100;

        return (
          <div key={phase} className="space-y-3">
            {/* Phase Header */}
            <div
              className={`p-4 rounded-lg border-2 ${phaseInfo.bgColor} ${
                isCurrentPhase ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={phaseInfo.color}>{phaseInfo.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg capitalize">{phaseInfo.title} Phase</h3>
                    <p className="text-sm text-gray-600">
                      {completedInPhase} of {phaseItems.length} items completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(phaseProgress)}%</div>
                  {isPastPhase && <Badge className="bg-green-600">Completed</Badge>}
                  {isCurrentPhase && <Badge className="bg-blue-600">Active</Badge>}
                </div>
              </div>
            </div>

            {/* Phase Items */}
            <div className="space-y-2 pl-4 border-l-4" style={{
              borderColor: phaseInfo.color.replace('text-', 'rgb(').replace('-600', '') + ')'
            }}>
              {phaseItems.map((item: LearningItem, itemIndex) => {
                const isLocked = !isPastPhase && !isCurrentPhase;
                
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all ${
                      item.completed
                        ? 'bg-green-50 border-green-200'
                        : isLocked
                          ? 'bg-gray-100 border-gray-200 opacity-60'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isLocked ? (
                          <Lock className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500">{ITEM_TYPE_ICONS[item.type]}</span>
                          <h4 className={`font-medium text-sm ${
                            item.completed ? 'text-green-700 line-through' : 'text-gray-900'
                          }`}>
                            {itemIndex + 1}. {item.title}
                          </h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Item Type Badge */}
                      <div className="flex-shrink-0">
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            item.completed ? 'bg-green-200' : ''
                          }`}
                        >
                          {item.duration}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phase Connector */}
            {phaseIndex < phases.length - 1 && (
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-gray-300 to-gray-200" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

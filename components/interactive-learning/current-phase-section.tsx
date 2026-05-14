'use client';

import React from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Hammer, TrendingUp, Play, CheckCircle2, Clock, Zap } from 'lucide-react';
import { LearningPhase, LearningItem } from '@/lib/learning-path-generator';

const PHASE_COLORS: Record<LearningPhase, string> = {
  learn: 'bg-blue-100 text-blue-800 border-blue-300',
  build: 'bg-purple-100 text-purple-800 border-purple-300',
  grow: 'bg-green-100 text-green-800 border-green-300',
};

const PHASE_ICONS: Record<LearningPhase, React.ReactNode> = {
  learn: <BookOpen className="w-5 h-5" />,
  build: <Hammer className="w-5 h-5" />,
  grow: <TrendingUp className="w-5 h-5" />,
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-blue-50 border-blue-200',
  project: 'bg-purple-50 border-purple-200',
  challenge: 'bg-green-50 border-green-200',
};

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  lesson: <BookOpen className="w-4 h-4" />,
  project: <Hammer className="w-4 h-4" />,
  challenge: <Zap className="w-4 h-4" />,
};

export function CurrentPhaseSection() {
  const { learningPath, completeItem, getCurrentPhaseItems } = useLearning();

  if (!learningPath) return null;

  const currentPhaseItems = getCurrentPhaseItems();
  const completedItems = currentPhaseItems.filter((item) => item.completed).length;
  const phaseProgress = (completedItems / currentPhaseItems.length) * 100;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {PHASE_ICONS[learningPath.currentPhase]}
              <CardTitle className="capitalize text-2xl">
                {learningPath.currentPhase} Phase
              </CardTitle>
              <Badge className={PHASE_COLORS[learningPath.currentPhase]}>
                Current
              </Badge>
            </div>
            <CardDescription>
              Complete {currentPhaseItems.length} items to master this phase
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{Math.round(phaseProgress)}%</div>
            <div className="text-sm text-gray-600">
              {completedItems}/{currentPhaseItems.length} complete
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {currentPhaseItems.map((item: LearningItem) => (
            <button
              key={item.id}
              onClick={() => completeItem(item.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                item.completed
                  ? 'bg-green-50 border-green-300'
                  : ITEM_TYPE_COLORS[item.type] || 'bg-gray-50 border-gray-200'
              } hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">{ITEM_TYPE_ICONS[item.type]}</span>
                    <h3 className={`font-semibold ${item.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </div>
                    {item.resources && (
                      <div className="text-gray-400">
                        {item.resources.length} resources
                      </div>
                    )}
                  </div>
                </div>

                {!item.completed && (
                  <Button
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg border border-dashed border-blue-300">
          <p className="text-sm text-gray-600">
            💡 <span className="font-semibold">Pro tip:</span> Complete all items in this phase to unlock the next one!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

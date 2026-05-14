'use client';

import React from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BookOpen, Hammer, TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react';
import { LearningPhase, LearningItem } from '@/lib/learning-path-generator';

const PHASE_COLORS: Record<LearningPhase, string> = {
  learn: '#3b82f6',
  build: '#a855f7',
  grow: '#10b981',
};

export function ProgressStats() {
  const { learningPath, getPhaseProgress } = useLearning();

  if (!learningPath) return null;

  const phases: LearningPhase[] = ['learn', 'build', 'grow'];
  
  // Prepare data for charts
  const phaseData = phases.map((phase) => {
    const progress = getPhaseProgress(phase);
    return {
      name: phase.charAt(0).toUpperCase() + phase.slice(1),
      completed: progress.completed,
      remaining: progress.total - progress.completed,
      total: progress.total,
    };
  });

  const itemTypeData = [
    {
      name: 'Lessons',
      value: learningPath.items.filter((item) => item.type === 'lesson').length,
      color: '#3b82f6',
    },
    {
      name: 'Projects',
      value: learningPath.items.filter((item) => item.type === 'project').length,
      color: '#a855f7',
    },
    {
      name: 'Challenges',
      value: learningPath.items.filter((item) => item.type === 'challenge').length,
      color: '#10b981',
    },
  ];

  const completedByType = {
    lessons: learningPath.items.filter((item) => item.type === 'lesson' && item.completed).length,
    projects: learningPath.items.filter((item) => item.type === 'project' && item.completed).length,
    challenges: learningPath.items.filter((item) => item.type === 'challenge' && item.completed).length,
  };

  const estimatedTimeRemaining = learningPath.items
    .filter((item) => !item.completed)
    .length * 2; // Assuming 2 hours per item

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Items Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {learningPath.progress.completed}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              of {learningPath.progress.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {learningPath.progress.percentage}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              of learning path
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ~{estimatedTimeRemaining}h
            </div>
            <p className="text-xs text-gray-500 mt-1">
              estimated hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize text-purple-600">
              {learningPath.currentPhase}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              phase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress by Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                <Bar dataKey="remaining" stackId="a" fill="#d1d5db" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Item Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={itemTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {itemTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Item Type Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completion by Content Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'Lessons', completed: completedByType.lessons, total: itemTypeData[0].value, icon: BookOpen, color: 'blue' },
              { type: 'Projects', completed: completedByType.projects, total: itemTypeData[1].value, icon: Hammer, color: 'purple' },
              { type: 'Challenges', completed: completedByType.challenges, total: itemTypeData[2].value, icon: TrendingUp, color: 'green' },
            ].map((item) => {
              const Icon = item.icon;
              const percentage = Math.round((item.completed / item.total) * 100);
              return (
                <div key={item.type} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 text-${item.color}-600`} />
                    <h3 className="font-semibold text-gray-900">{item.type}</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {item.completed}/{item.total}
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-full bg-${item.color}-600 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{percentage}% complete</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

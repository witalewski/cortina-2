"use client";

import { LessonStatus } from "@/lib/lessons/Lesson";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

interface LessonPaneProps {
  lessonTitle: string;
  instruction: string;
  taskNumber: number;
  totalTasks: number;
  status: LessonStatus;
  onPlayExample: () => void;
  onStartListening: () => void;
  evaluationResult?: {
    isCorrect: boolean;
    message: string;
    shouldAdvance: boolean;
  } | null;
}

export function LessonPane({
  lessonTitle,
  instruction,
  taskNumber,
  totalTasks,
  status,
  onPlayExample,
  onStartListening,
  evaluationResult,
}: LessonPaneProps) {
  const isComplete = status === 'complete';
  const isEvaluating = status === 'evaluating';
  const isListening = status === 'listening';

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {lessonTitle}
            </h1>
            {!isComplete && (
              <p className="text-sm text-muted-foreground">
                Task {taskNumber} of {totalTasks}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? "Complete!" : `Task ${taskNumber}/${totalTasks}`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Instruction Area */}
        <div className="text-center">
          <p className="text-lg">
            {instruction}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3">
          {isComplete ? (
            <Button 
              variant="default" 
              onClick={() => window.location.reload()}
            >
              Start New Lesson
            </Button>
          ) : (
            <>
              {/* Play Example Button - always available during lesson */}
              <Button 
                variant="outline" 
                onClick={onPlayExample}
                disabled={isEvaluating}
              >
                Hear Example
              </Button>
              
              {/* Start Listening Button */}
              {!isListening && !isEvaluating && (
                <Button 
                  variant="default" 
                  onClick={onStartListening}
                >
                  Start Playing
                </Button>
              )}
              
              {/* Listening Indicator */}
              {isListening && (
                <Button variant="secondary" disabled>
                  Listening...
                </Button>
              )}
              
              {/* Evaluating Indicator */}
              {isEvaluating && (
                <Button variant="secondary" disabled>
                  Evaluating...
                </Button>
              )}
            </>
          )}
        </div>

        {/* Evaluation Result */}
        {evaluationResult && (
          <div className={`text-center p-4 rounded-lg border ${
            evaluationResult.isCorrect 
              ? 'border-green-200 bg-green-50 text-green-800' 
              : 'border-orange-200 bg-orange-50 text-orange-800'
          }`}>
            <p className="font-medium">
              {evaluationResult.message}
            </p>
            
            {evaluationResult.shouldAdvance ? (
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  Start New Lesson
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  onClick={onStartListening}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-6 rounded-lg border border-green-200 bg-green-50 text-green-800">
            <div className="text-2xl font-semibold mb-2">🎉</div>
            <p className="text-lg font-medium">
              Excellent! You've completed the lesson!
            </p>
            <p className="text-sm mt-2 text-green-600">
              You've mastered the I-V-vi-IV chord progression in C major.
            </p>
          </div>
        )}

        {/* Status Help Text */}
        {!isComplete && !evaluationResult && (
          <div className="text-center text-sm text-muted-foreground">
            {status === 'showing' && (
              <p>Listen to the example chord, then click "Start Playing" to try it yourself.</p>
            )}
            {status === 'listening' && (
              <p>Play exactly 3 notes on your keyboard to form the chord.</p>
            )}
            {status === 'evaluating' && (
              <p>Checking your answer...</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
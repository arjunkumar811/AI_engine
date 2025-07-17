import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { Step } from "../types/index";

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  if (steps.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
        <div className="text-center py-4">
          <div className="text-gray-500 mb-2">
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-xs text-gray-400">Building steps will appear here...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            currentStep === step.id
              ? "bg-blue-500/10 border border-blue-500/30"
              : "bg-gray-900/50 border border-gray-700/50 hover:bg-gray-800/70"
          }`}
          onClick={() => onStepClick(step.id)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {step.status === "completed" ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              ) : step.status === "in-progress" ? (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              ) : (
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-300 font-medium">{index + 1}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-100 text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
              {step.status === "completed" && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-green-400">✓</span>
                  <span className="text-xs text-green-400">Completed</span>
                </div>
              )}
              {step.status === "in-progress" && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                  <span className="text-xs text-blue-400">In Progress</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

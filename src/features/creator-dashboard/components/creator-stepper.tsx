import React from "react";
import { Check } from "lucide-react";

export type StepState = "upcoming" | "current" | "completed";

export interface StepItem {
  id: string;
  label: string;
  state: StepState;
}

interface CreatorStepperProps {
  steps: StepItem[];
}

export function CreatorStepper({ steps }: CreatorStepperProps) {
  // Find the index of the "current" step, or the last "completed" step if all done
  let progressIndex = steps.findIndex(s => s.state === "current");
  if (progressIndex === -1) {
    // If no current step, check if all are completed
    progressIndex = steps.every(s => s.state === "completed") ? steps.length - 1 : 0;
  }
  
  // Calculate percentage width (0 to 100%)
  const progressPercentage = steps.length > 1 
    ? (progressIndex / (steps.length - 1)) * 100 
    : 0;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full px-6 relative">
        {/* Background connector line */}
        <div className="absolute left-0 top-4 w-full h-[2px] bg-creator-border z-0" />
        
        {/* Active connector line */}
        <div 
          className="absolute left-0 top-4 h-[2px] bg-creator-gold z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        />
        
        {steps.map((step, index) => {
          const isCompleted = step.state === "completed";
          const isCurrent = step.state === "current";

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Step Circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300 ${
                  isCompleted 
                    ? "bg-creator-gold border-creator-gold text-creator-bg"
                    : isCurrent 
                      ? "bg-creator-bg border-creator-gold text-creator-gold" 
                      : "bg-creator-bg border-creator-border text-creator-muted"
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : `0${index + 1}`}
              </div>

              {/* Step Label */}
              <span 
                className={`mt-3 absolute top-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  isCompleted || isCurrent ? "text-white" : "text-creator-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

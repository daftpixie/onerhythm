"use client";

import { motion } from "framer-motion";

type ProcessingStage = "uploading" | "sanitizing" | "transforming";

type ProcessingStateProps = {
  currentStage: ProcessingStage;
  fileName: string;
};

const stages: { key: ProcessingStage; label: string; description: string }[] = [
  {
    key: "uploading",
    label: "Uploading",
    description: "Securely receiving your file",
  },
  {
    key: "sanitizing",
    label: "De-identifying",
    description: "Stripping metadata and redacting visible identifiers",
  },
  {
    key: "transforming",
    label: "Transforming",
    description: "Creating your anonymous artistic tile",
  },
];

function stageIndex(stage: ProcessingStage): number {
  return stages.findIndex((s) => s.key === stage);
}

export function ProcessingState({ currentStage, fileName }: ProcessingStateProps) {
  const activeIndex = stageIndex(currentStage);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-tertiary">Processing {fileName}</p>
      {stages.map((stage, i) => {
        const isActive = i === activeIndex;
        const isCompleted = i < activeIndex;

        return (
          <motion.div
            key={stage.key}
            className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
              isActive
                ? "border-signal/50 bg-signal/5"
                : isCompleted
                  ? "border-token bg-cosmos"
                  : "border-token/50 bg-cosmos/50"
            }`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              {isCompleted ? (
                <svg
                  className="h-5 w-5 text-signal"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isActive ? (
                <motion.div
                  className="h-3 w-3 rounded-full bg-signal"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              ) : (
                <div className="h-3 w-3 rounded-full bg-cosmos-nebula" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  isActive
                    ? "text-text-primary"
                    : isCompleted
                      ? "text-text-secondary"
                      : "text-text-tertiary"
                }`}
              >
                {stage.label}
              </p>
              <p className="text-xs text-text-tertiary">{stage.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

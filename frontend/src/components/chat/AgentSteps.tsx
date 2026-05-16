"use client";

const STEP_DEFS = [
  { key: "data_analyst",        label: "Veri Analizi" },
  { key: "behavioral_profiler", label: "Davranış Analizi" },
  { key: "financial_coach",     label: "Finansal Koçluk" },
  { key: "reporting",           label: "Raporlama" },
];

interface AgentStepsProps {
  activeSteps: string[];
  isLoading: boolean;
}

export default function AgentSteps({ activeSteps, isLoading }: AgentStepsProps) {
  if (!isLoading && activeSteps.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap mb-2">
      {STEP_DEFS.map(def => {
        const isDone   = activeSteps.includes(def.key) && !isLoading;
        const isActive = isLoading && activeSteps.includes(def.key);

        return (
          <div
            key={def.key}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] transition-all duration-500"
            style={{
              background:   isDone   ? "#10b98111" : isActive ? "#f59e0b11" : "#ffffff05",
              borderColor:  isDone   ? "#10b98144" : isActive ? "#f59e0b55" : "#ffffff0f",
              color:        isDone   ? "#10b981"   : isActive ? "#f59e0b"   : "#44445a",
              animation:    isActive ? "agent-pulse 1s ease-in-out infinite" : "none",
            }}
          >
            {isDone ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5l2 2 4-4"
                  stroke="#10b981" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: "checkmark-draw 300ms ease forwards" }}
                />
              </svg>
            ) : isActive ? (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"
                style={{ animation: "dot-pulse 800ms ease-in-out infinite" }}
              />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[#44445a]" />
            )}
            {def.label}
          </div>
        );
      })}
    </div>
  );
}

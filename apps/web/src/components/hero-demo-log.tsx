import { motion } from "framer-motion";

import type { HeroDemoStep } from "@/components/landing-hero-demo";

type heroDemoLogProps = {
  steps: HeroDemoStep[];
};

export const HeroDemoLog = ({ steps }: heroDemoLogProps) => {
  const logSteps = steps.filter(
    (step) =>
      step.type === "command" || step.type === "stdout" || step.type === "stderr"
  );

  return (
    <div className="min-h-0 overflow-hidden border-r border-border/80 bg-[#0b0d11]">
      <div className="border-b border-border/80 px-4 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Output
        </div>
      </div>
      <div className="space-y-2 p-4 font-mono text-xs leading-5">
        {logSteps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={step.type === "stderr" ? "text-[#fca5a5]" : "text-muted-foreground"}
          >
            {step.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

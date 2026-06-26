import { motion } from "framer-motion";
import { CircleAlert } from "lucide-react";

type heroDemoErrorCardProps = {
  isVisible: boolean;
};

export const HeroDemoErrorCard = ({ isVisible }: heroDemoErrorCardProps) => {
  if (!isVisible) {
    return (
      <div className="rounded-md border border-border/80 bg-background p-3 text-xs text-muted-foreground">
        Watching stderr...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-md border border-[#59d6c2]/35 bg-[#121d1c] p-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CircleAlert className="h-4 w-4 text-[#59d6c2]" />
        code-node-viewer.tsx
      </div>
      <div className="mt-2 grid gap-1 font-mono text-[11px] leading-5 text-muted-foreground">
        <div>line 122</div>
        <div>graph selection</div>
        <div>exit code 2</div>
      </div>
    </motion.div>
  );
};

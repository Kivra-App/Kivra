import { motion } from "framer-motion";
import { CheckCircle2, NotebookText } from "lucide-react";

type heroDemoResolutionNoteProps = {
  isMemoryUpdated: boolean;
  isVisible: boolean;
};

export const HeroDemoResolutionNote = ({
  isMemoryUpdated,
  isVisible
}: heroDemoResolutionNoteProps) => {
  if (!isVisible) {
    return (
      <div className="rounded-md border border-border/80 bg-background p-3 text-xs text-muted-foreground">
        Waiting for matching memory...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-md border border-border/80 bg-background p-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {isMemoryUpdated ? (
          <CheckCircle2 className="h-4 w-4 text-[#59d6c2]" />
        ) : (
          <NotebookText className="h-4 w-4 text-muted-foreground" />
        )}
        {isMemoryUpdated ? "Memory updated." : "Resolution note"}
      </div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">
        Preserve selected node id only after the graph has rebuilt.
      </div>
    </motion.div>
  );
};

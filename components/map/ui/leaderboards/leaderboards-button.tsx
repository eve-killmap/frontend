import React, { useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LeaderboardRole,
  LeaderboardScope,
  LeaderboardWindow,
} from "@/lib/map/leaderboards";
import { useApiHealthStore } from "@/stores/api-health-store";
import { LeaderboardsDialogBody } from "./leaderboards-dialog";

export const LeaderboardsButton = React.memo(function LeaderboardsButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [timeWindow, setTimeWindow] = useState<LeaderboardWindow>("all");
  const [role, setRole] = useState<LeaderboardRole>("attacker");
  const [scope, setScope] = useState<LeaderboardScope>("players");
  const apiUnhealthy = useApiHealthStore((s) => s.healthy === false);

  if (apiUnhealthy) return null;

  return (
    <Dialog open={open} onOpenChange={onToggle}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={`btn-glass ${open ? "text-capsuleer border-capsuleer/60" : ""}`}
          aria-expanded={open}
          title="Leaderboards"
        >
          <Trophy />
          <span className="btn-label">Leaderboards</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[min(90vw,64rem)] max-h-[85vh] rounded-none p-0 overflow-hidden flex flex-col gap-0">
        <div className="flex items-center px-5 py-3 border-b border-border shrink-0">
          <DialogTitle className="text-foreground font-semibold text-lg">
            Leaderboards
          </DialogTitle>
          <DialogDescription className="sr-only">
            Top characters, corporations, alliances, factions, ships, and
            weapons by kills or losses.
          </DialogDescription>
        </div>
        <LeaderboardsDialogBody
          timeWindow={timeWindow}
          role={role}
          scope={scope}
          onWindowChange={setTimeWindow}
          onRoleChange={setRole}
          onScopeChange={setScope}
          onClose={onToggle}
        />
      </DialogContent>
    </Dialog>
  );
});

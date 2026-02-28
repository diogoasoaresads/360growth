"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History } from "lucide-react";
import type { ChangelogEntry } from "@/lib/build-info";

interface ChangelogButtonProps {
  buildId: string;
  updatedAt: string;
  updatedTz: string;
  entries: ChangelogEntry[];
}

export function ChangelogButton({
  buildId,
  updatedAt,
  updatedTz,
  entries,
}: ChangelogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 font-mono text-xs h-auto py-2"
        onClick={() => setOpen(true)}
      >
        <History className="mr-2 h-3 w-3 flex-shrink-0" />
        <span>
          {buildId} · {updatedAt} ({updatedTz})
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              Build / Histórico de Atualizações
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm font-mono">
            {entries.map((entry) => (
              <div key={entry.id}>
                <p className="text-muted-foreground font-semibold">
                  [{entry.id}] {entry.at} ({updatedTz})
                </p>
                {entry.lines.map((line, i) => (
                  <p key={i} className="text-muted-foreground/70 pl-3">
                    • {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

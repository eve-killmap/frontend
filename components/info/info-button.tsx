import React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ControlsTab } from "./info-controls";
import { AboutTab } from "./info-about";
import { StackTab } from "./info-stack";
import { FAQTab } from "./info-faq";
import { CreditsTab } from "./info-credits";
import { LegalTab } from "./info-legal";

export function InfoStandalone() {
  return <InfoTabs />;
}

export const InfoButton = React.memo(function InfoButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pointer-events-auto">
      <Dialog open={open} onOpenChange={onToggle}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="btn-glass"
            title="About"
          >
            <Info />
            <span className="btn-label">About</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[min(90vw,64rem)] h-[85vh] rounded-none p-0 overflow-hidden flex flex-col gap-0">
          <div className="flex items-center px-5 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-foreground font-semibold text-lg">
              About EVE Killmap
            </DialogTitle>
            <DialogDescription className="sr-only">
              Learn about EVE Killmap, its features, and the data it displays.
            </DialogDescription>
          </div>
          <InfoTabs />
        </DialogContent>
      </Dialog>
    </div>
  );
});

function InfoTabs() {
  return (
    <Tabs defaultValue="controls" className="flex-1 flex flex-col min-h-0">
      <div className="px-5 pt-3">
        <TabsList className="bg-panel border border-border h-auto w-full p-0.5">
          {[
            { value: "controls", label: "Controls" },
            { value: "about", label: "About" },
            { value: "stack", label: "Tech Stack" },
            { value: "faq", label: "Frequently Asked Questions" },
            { value: "credits", label: "Credits" },
            { value: "legal", label: "Legal / Copyright" },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="px-5 py-1.5 text-sm data-[state=active]:bg-panel-elevated data-[state=active]:text-capsuleer data-[state=active]:shadow-none text-fg-muted cursor-pointer"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TabsContent value="controls" className="p-5">
          <ControlsTab />
        </TabsContent>
        <TabsContent value="about" className="p-5">
          <AboutTab />
        </TabsContent>
        <TabsContent value="stack" className="p-5">
          <StackTab />
        </TabsContent>
        <TabsContent value="faq" className="p-5">
          <FAQTab />
        </TabsContent>
        <TabsContent value="credits" className="p-5">
          <CreditsTab />
        </TabsContent>
        <TabsContent value="legal" className="p-5">
          <LegalTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}

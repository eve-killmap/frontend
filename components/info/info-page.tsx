import { InfoStandalone } from "@/components/info/info-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppLink } from "@/components/common/app-link";
import { useDocumentTitle } from "@/lib/document-title";

export default function Page() {
  useDocumentTitle("About");
  return (
    <div className="min-h-screen bg-abyss text-foreground">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border">
        <Button asChild variant="outline" size="lg" className="btn-glass">
          <AppLink to="/">
            <ArrowLeft />
            Back to Home
          </AppLink>
        </Button>
      </header>
      <div className="p-6">
        <InfoStandalone />
      </div>
    </div>
  );
}

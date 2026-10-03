import { useEffect, useState, type ReactNode } from "react";
import { useRouteError } from "react-router-dom";
import {
  AlertOctagon,
  TriangleAlert,
  RefreshCw,
  Map,
  Copy,
  Check,
  Bug,
} from "lucide-react";
import { useDocumentTitle } from "@/lib/document-title";
import { Panel, PanelHeader, PanelTitle } from "@/components/common/panel";
import { Eyebrow } from "@/components/common/eyebrow";
import { useBlockingErrorStore } from "@/stores/blocking-error-store";

const ISSUES_URL = "https://github.com/eve-killmap/frontend/issues/new";

const STACK_LINES = 8;

function formatTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function buildReport(
  errorCode: string,
  message: string | undefined,
  stack: string | undefined,
): string {
  const lines = [
    `Error code: ${errorCode}`,
    `Message: ${message ?? "(none)"}`,
    `URL: ${window.location.href}`,
    `Time: ${formatTimestamp(new Date())}`,
    `Browser: ${navigator.userAgent}`,
  ];
  if (stack) {
    lines.push(
      "",
      "Stack (minified):",
      stack.split("\n").slice(0, STACK_LINES).join("\n"),
    );
  }
  return lines.join("\n");
}

function ReportActions({
  errorCode,
  message,
  stack,
}: {
  errorCode: string;
  message?: string;
  stack?: string;
}) {
  const [copied, setCopied] = useState(false);

  const details = buildReport(errorCode, message, stack);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const issueUrl = `${ISSUES_URL}?title=${encodeURIComponent(
    `[${errorCode}] ${message ?? "Unexpected error"}`,
  )}&body=${encodeURIComponent(
    `**What were you doing when this happened?**\n\n\n---\n\n\`\`\`\n${details}\n\`\`\`\n`,
  )}`;

  return (
    <>
      <button
        onClick={copy}
        className="flex items-center gap-2 px-4 py-2 border border-border text-fg-faint text-sm hover:bg-panel hover:text-fg-secondary hover:border-border/80 transition-colors cursor-pointer"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copied ? "Copied" : "Copy details"}
      </button>
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 border border-border text-fg-faint text-sm hover:bg-panel hover:text-fg-secondary hover:border-border/80 transition-colors cursor-pointer"
      >
        <Bug className="w-3.5 h-3.5" />
        Report this
      </a>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
      <Eyebrow size="sm">{label}</Eyebrow>
      <span className="font-mono text-2xs text-fg-muted break-all">
        {value}
      </span>
    </div>
  );
}

type ErrorTone = "error" | "warning";

interface ErrorContentProps {
  heading: string;
  subheading?: ReactNode;
  message?: string;
  errorCode?: string;
  tone?: ErrorTone;
  actions?: ReactNode;
}

export function ErrorContent({
  heading,
  subheading = "The requested resource could not be loaded.",
  message,
  errorCode = "ERR_LOAD_FAILED",
  tone = "error",
  actions,
}: ErrorContentProps) {
  const timestamp = formatTimestamp(new Date());
  const Icon = tone === "warning" ? TriangleAlert : AlertOctagon;
  const iconColor =
    tone === "warning" ? "text-capsuleer/80" : "text-red-500/70";

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-2.5 mb-1.5">
        <Icon className={`${iconColor} w-5 h-5 shrink-0`} />
        <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
      </div>
      {subheading && <p className="text-sm text-fg-muted mb-7">{subheading}</p>}

      <Panel className="mb-4">
        <PanelHeader>
          <PanelTitle>Details</PanelTitle>
        </PanelHeader>
        <div className="px-3 py-3 space-y-2">
          <MetaRow label="Timestamp" value={timestamp} />
          <MetaRow label="Error code" value={errorCode} />
        </div>
      </Panel>

      {message && (
        <Panel className="mb-7">
          <PanelHeader>
            <PanelTitle>Error message</PanelTitle>
          </PanelHeader>
          <pre className="px-3 py-3 text-2xs font-mono text-fg-faint whitespace-pre-wrap break-all leading-relaxed">
            {message}
          </pre>
        </Panel>
      )}

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

interface ErrorPageViewProps {
  message?: string;
  errorCode?: string;
  heading?: string;
  subheading?: ReactNode;
  onRetry?: () => void;
  backToMap?: boolean;
  stack?: string;
  reportable?: boolean;
}

export function ErrorPageView({
  message,
  errorCode = "ERR_LOAD_FAILED",
  heading = "Something went wrong",
  subheading = "The requested resource could not be loaded.",
  onRetry,
  backToMap = true,
  stack,
  reportable = true,
}: ErrorPageViewProps) {
  useDocumentTitle(heading);

  useEffect(() => {
    const { register, unregister } = useBlockingErrorStore.getState();
    register();
    return unregister;
  }, []);

  return (
    <div
      className="min-h-screen bg-abyss flex flex-col font-sans"
      style={{
        backgroundImage:
          "linear-gradient(color-mix(in srgb, var(--border) 6%, transparent) 1px, transparent 1px), linear-gradient(to right, color-mix(in srgb, var(--border) 6%, transparent) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorContent
          heading={heading}
          subheading={subheading}
          message={message}
          errorCode={errorCode}
          actions={
            <>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 border border-capsuleer/50 text-capsuleer text-sm hover:bg-capsuleer/10 hover:border-capsuleer/80 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
              {backToMap && (
                <button
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-border text-fg-faint text-sm hover:bg-panel hover:text-fg-secondary hover:border-border/80 transition-colors cursor-pointer"
                >
                  <Map className="w-3.5 h-3.5" />
                  Back to map
                </button>
              )}
              {reportable && (
                <ReportActions
                  errorCode={errorCode}
                  message={message}
                  stack={stack}
                />
              )}
            </>
          }
        />
      </div>
    </div>
  );
}

export function ErrorPage({
  heading,
  subheading,
}: Pick<ErrorPageViewProps, "heading" | "subheading">) {
  const error = useRouteError() as Error & {
    status?: number;
    statusText?: string;
  };
  const errorCode = error?.status ? `HTTP_${error.status}` : "ERR_LOAD_FAILED";
  const message = error?.message ?? error?.statusText;
  return (
    <ErrorPageView
      heading={heading}
      subheading={subheading}
      message={message}
      errorCode={errorCode}
      stack={error?.stack}
      onRetry={() => window.location.reload()}
    />
  );
}

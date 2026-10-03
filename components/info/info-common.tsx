import { Eyebrow } from "@/components/common/eyebrow";
import { ExternalLink } from "@/components/common/external-link";

export function Hyperlink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return <ExternalLink href={href}>{children}</ExternalLink>;
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Eyebrow as="h3" size="lg" className="text-fg-faint mb-3">
        {title}
      </Eyebrow>
      {children}
    </div>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Eyebrow as="h4" size="md" className="text-sm text-fg-faint mb-2">
        {title}
      </Eyebrow>
      {children}
    </div>
  );
}

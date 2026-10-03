import { Pin } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { AppLink } from "@/components/common/app-link";

export interface SystemRowProps {
  name: string;
  slug: string;
  triglavian: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: (slug: string) => void;
}

export function SystemRow({
  name,
  slug,
  triglavian,
  pinned,
  onSelect,
  onTogglePin,
}: SystemRowProps) {
  return (
    <CommandItem
      value={name}
      onSelect={onSelect}
      className="group hover:cursor-pointer flex items-center justify-between"
    >
      <AppLink
        to={`/${slug}`}
        navigate={false}
        tabIndex={-1}
        className={`flex-1 min-w-0 truncate ${triglavian ? "font-triglavian" : ""}`}
      >
        {name}
      </AppLink>
      <button
        type="button"
        aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(slug);
        }}
        className={`shrink-0 cursor-pointer transition-colors hover:text-capsuleer ${
          pinned
            ? "text-capsuleer"
            : "text-fg-subtle opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 focus-visible:opacity-100"
        }`}
      >
        <Pin className={`size-3.5 ${pinned ? "fill-current" : ""}`} />
      </button>
    </CommandItem>
  );
}

import type { ComponentProps, MouseEvent } from "react";
import { navigateTo } from "@/lib/navigation-functions";
import { isModifiedClick } from "@/lib/ui/is-modified-click";

export interface AppLinkProps extends Omit<ComponentProps<"a">, "href"> {
  to: string;
  navigate?: boolean;
}

export function AppLink({
  to,
  navigate = true,
  onClick,
  ...rest
}: AppLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (isModifiedClick(e)) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    if (navigate) navigateTo?.(to);
  };
  return <a {...rest} href={to} onClick={handleClick} />;
}

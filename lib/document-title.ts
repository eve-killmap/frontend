import { useEffect } from "react";

const BASE_TITLE = "EVE Killmap";

export function formatTitle(page: string | null): string {
  return page ? `${page} - ${BASE_TITLE}` : BASE_TITLE;
}

export function useDocumentTitle(page: string | null | undefined): void {
  useEffect(() => {
    if (page === undefined) return;
    document.title = formatTitle(page);
  }, [page]);
}

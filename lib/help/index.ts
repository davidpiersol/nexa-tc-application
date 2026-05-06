import Fuse from "fuse.js";
import { HELP_ARTICLES } from "./articles.generated";
export { HELP_ARTICLES } from "./articles.generated";
export { resolveHelpSlugForPath } from "./match-route";
export type { HelpArticle, HelpRole } from "./types";
import type { HelpArticle } from "./types";

let fuseInstance: Fuse<HelpArticle> | null = null;

export function getHelpFuse(): Fuse<HelpArticle> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(HELP_ARTICLES, {
      keys: [
        { name: "title", weight: 0.35 },
        { name: "slug", weight: 0.15 },
        { name: "content", weight: 0.5 },
      ],
      threshold: 0.42,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const q = query.trim();
  if (!q) return [...HELP_ARTICLES];
  return getHelpFuse()
    .search(q)
    .map((r) => r.item);
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

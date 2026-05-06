export type HelpRole =
  | "all"
  | "tc"
  | "buyer"
  | "seller"
  | "agent"
  | "mortgage"
  | "title";

export type HelpArticle = {
  slug: string;
  title: string;
  /** Human-readable route pattern for the index */
  route: string;
  role: HelpRole;
  /** Markdown body */
  content: string;
};

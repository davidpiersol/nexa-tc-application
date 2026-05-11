import { HELP_ARTICLES } from "@/lib/help";

export default function GlobalAdminWikiPage() {
  const grouped = HELP_ARTICLES.reduce<Record<string, typeof HELP_ARTICLES>>((acc, article) => {
    const key = article.role;
    if (!acc[key]) acc[key] = [];
    acc[key].push(article);
    return acc;
  }, {});

  const order = ["all", "admin", "tc", "agent", "buyer", "seller", "mortgage", "title"];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Application Wiki</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Central in-app documentation index for onboarding, support, and operations.
        </p>
      </header>

      {order
        .filter((role) => grouped[role]?.length)
        .map((role) => (
          <section
            key={role}
            className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm"
          >
            <h3 className="font-display text-heading-md text-brand-navy">
              {role === "all" ? "Global" : role.toUpperCase()} Guides
            </h3>
            <ul className="mt-3 space-y-2">
              {grouped[role]
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((article) => (
                  <li key={article.slug} className="rounded-brand-md border border-neutral-200 px-3 py-2">
                    <p className="font-sans text-sm font-semibold text-brand-navy">{article.title}</p>
                    <p className="font-sans text-xs text-neutral-600">{article.route}</p>
                    <p className="font-sans text-xs text-neutral-500">{article.slug}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

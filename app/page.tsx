import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-10">
      <h1 className="font-display text-heading-xl text-brand-navy">Nexa TC</h1>
      <p className="text-ui-body text-neutral-600">
        Scaffold routes — use dashboard sections below during development.
      </p>
      <ul className="flex flex-col gap-2 text-ui-body">
        <li>
          <Link className="text-brand-steel underline" href="/login">
            Login
          </Link>
        </li>
        <li>
          <Link className="text-brand-steel underline" href="/tc">
            TC dashboard
          </Link>
        </li>
        <li>
          <Link className="text-brand-steel underline" href="/buyer/example-id">
            Buyer dashboard (sample id)
          </Link>
        </li>
      </ul>
    </div>
  );
}

import { LoginForm } from "./login-form";

function firstParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * Reads `?redirect=` on the server so the client form does not depend on `useSearchParams`
 * (avoids Suspense / hydration edge cases that can render a blank login shell).
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirect = firstParam(searchParams.redirect) ?? "/tc";
  return <LoginForm redirect={redirect} />;
}

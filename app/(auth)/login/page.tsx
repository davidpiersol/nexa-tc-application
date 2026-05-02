import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans text-sm text-neutral-600" aria-live="polite">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

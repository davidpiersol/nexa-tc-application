export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-brand-lg border border-neutral-300 bg-white p-8 shadow-brand-md">
        {children}
      </div>
    </div>
  );
}

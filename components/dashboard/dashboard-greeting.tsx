"use client";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ fullName }: { fullName?: string | null }) {
  const firstName = fullName?.trim().split(/\s+/)[0];
  if (!firstName) return null;
  return (
    <p className="font-display text-heading-md text-brand-navy">
      {greetingForHour(new Date().getHours())}, {firstName}.
    </p>
  );
}

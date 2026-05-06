export const TC_TIMEZONE_OPTIONS = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
] as const;

export const TC_DATE_FORMAT_OPTIONS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
] as const;

export type TcTimezoneOption = (typeof TC_TIMEZONE_OPTIONS)[number];
export type TcDateFormatOption = (typeof TC_DATE_FORMAT_OPTIONS)[number];

export function isTcTimezoneOption(value: string): value is TcTimezoneOption {
  return (TC_TIMEZONE_OPTIONS as readonly string[]).includes(value);
}

export function isTcDateFormatOption(value: string): value is TcDateFormatOption {
  return (TC_DATE_FORMAT_OPTIONS as readonly string[]).includes(value);
}

import type { ContactCategory } from "@/lib/contacts/categories";

export type ContactRow = {
  id: string;
  salutation: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  other_category_description: string | null;
  categories: ContactCategory[];
  brokerProfile: {
    id: string;
    brokerage: string;
    signingPlatform: string | null;
    signingPreference: string | null;
    settings: Record<string, unknown>;
    hasCredentials: boolean;
  } | null;
};

export type ContactFormValues = {
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  categories: ContactCategory[];
  otherCategoryDescription: string;
};

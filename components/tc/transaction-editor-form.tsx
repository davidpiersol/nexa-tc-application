"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TransactionStatus =
  | "draft"
  | "active"
  | "under_contract"
  | "pending_close"
  | "closed"
  | "cancelled";

type Mode = "create" | "edit";

export type TransactionEditorInitial = {
  id?: string;
  status: TransactionStatus;
  property_address: string | null;
  mls_number: string | null;
  close_date: string | null;
  notes: string | null;
  intake_data?: Record<string, unknown> | null;
};

export function TransactionEditorForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial: TransactionEditorInitial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const intake = (initial.intake_data ?? {}) as Record<string, unknown>;

  function getString(key: string): string {
    const v = intake[key];
    return typeof v === "string" ? v : "";
  }

  function getBool(key: string, fallback = false): boolean {
    const v = intake[key];
    return typeof v === "boolean" ? v : fallback;
  }

  async function getCsrfToken(): Promise<string | null> {
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const json = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
    return json.csrfToken ?? null;
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);

    const token = await getCsrfToken();
    if (!token) {
      setError("Security token missing. Refresh and try again.");
      setPending(false);
      return;
    }

    const readText = (k: string) => String(formData.get(k) ?? "").trim();
    const readBool = (k: string) => String(formData.get(k) ?? "") === "on";

    const intakeData = {
      // 5) TC / Internal
      tc_engaged: readBool("tc_engaged"),
      tc_review_completed_by: readText("tc_review_completed_by"),
      tc_review_completed_at: readText("tc_review_completed_at"),
      source_forms_received: readText("source_forms_received"),
      follow_up_required: readBool("follow_up_required"),
      follow_up_notes: readText("follow_up_notes"),
      tc_representation_side: readText("tc_representation_side"),

      // 1) Seller / Listing Client
      sellers_names: readText("sellers_names"),
      seller_signature_captured: readBool("seller_signature_captured"),
      seller_signature_date: readText("seller_signature_date"),
      seller_is_nm_broker: readBool("seller_is_nm_broker"),
      seller_has_other_listing_agreement: readBool("seller_has_other_listing_agreement"),
      conflict_of_interest_disclosed: readBool("conflict_of_interest_disclosed"),
      conflict_of_interest_explanation: readText("conflict_of_interest_explanation"),
      adverse_material_facts_disclosed: readBool("adverse_material_facts_disclosed"),
      adverse_material_facts_explanation: readText("adverse_material_facts_explanation"),
      property_legal_description: readText("property_legal_description"),
      property_type: readText("property_type"),
      community_type: readText("community_type"),
      farm_and_ranch: readBool("farm_and_ranch"),
      rights_conveyed: readBool("rights_conveyed"),
      rights_conveyed_explanation: readText("rights_conveyed_explanation"),
      fixture_exclusions: readText("fixture_exclusions"),

      // 3) Seller Broker(s)
      seller_broker_1_brokerage_firm: readText("seller_broker_1_brokerage_firm"),
      seller_broker_1_qualifying_broker_name: readText(
        "seller_broker_1_qualifying_broker_name",
      ),
      seller_broker_1_nmrec_license_no: readText("seller_broker_1_nmrec_license_no"),
      seller_broker_1_broker_name: readText("seller_broker_1_broker_name"),
      seller_broker_1_team_name: readText("seller_broker_1_team_name"),
      seller_broker_1_office_phone: readText("seller_broker_1_office_phone"),
      seller_broker_1_cell_phone: readText("seller_broker_1_cell_phone"),
      seller_broker_1_email: readText("seller_broker_1_email"),
      seller_broker_1_address: readText("seller_broker_1_address"),
      seller_broker_1_city: readText("seller_broker_1_city"),
      seller_broker_1_state: readText("seller_broker_1_state"),
      seller_broker_1_zip_code: readText("seller_broker_1_zip_code"),
      seller_broker_1_is_realtor: readBool("seller_broker_1_is_realtor"),
      seller_broker_2_brokerage_firm: readText("seller_broker_2_brokerage_firm"),
      seller_broker_2_qualifying_broker_name: readText(
        "seller_broker_2_qualifying_broker_name",
      ),
      seller_broker_2_nmrec_license_no: readText("seller_broker_2_nmrec_license_no"),
      seller_broker_2_broker_name: readText("seller_broker_2_broker_name"),
      seller_broker_2_team_name: readText("seller_broker_2_team_name"),
      seller_broker_2_office_phone: readText("seller_broker_2_office_phone"),
      seller_broker_2_cell_phone: readText("seller_broker_2_cell_phone"),
      seller_broker_2_email: readText("seller_broker_2_email"),
      seller_broker_2_address: readText("seller_broker_2_address"),
      seller_broker_2_city: readText("seller_broker_2_city"),
      seller_broker_2_state: readText("seller_broker_2_state"),
      seller_broker_2_zip_code: readText("seller_broker_2_zip_code"),
      seller_broker_2_is_realtor: readBool("seller_broker_2_is_realtor"),

      // 2) Buyer / Buyer Client
      buyers_names: readText("buyers_names"),
      buyer_signature_captured: readBool("buyer_signature_captured"),
      buyer_signature_date: readText("buyer_signature_date"),
      buyer_is_nm_broker: readBool("buyer_is_nm_broker"),
      buyer_has_other_broker_agreement: readBool("buyer_has_other_broker_agreement"),

      // 4) Buyer Broker(s)
      buyer_broker_1_brokerage_firm: readText("buyer_broker_1_brokerage_firm"),
      buyer_broker_1_qualifying_broker_name: readText(
        "buyer_broker_1_qualifying_broker_name",
      ),
      buyer_broker_1_nmrec_license_no: readText("buyer_broker_1_nmrec_license_no"),
      buyer_broker_1_broker_name: readText("buyer_broker_1_broker_name"),
      buyer_broker_1_team_name: readText("buyer_broker_1_team_name"),
      buyer_broker_1_office_phone: readText("buyer_broker_1_office_phone"),
      buyer_broker_1_cell_phone: readText("buyer_broker_1_cell_phone"),
      buyer_broker_1_email: readText("buyer_broker_1_email"),
      buyer_broker_1_address: readText("buyer_broker_1_address"),
      buyer_broker_1_city: readText("buyer_broker_1_city"),
      buyer_broker_1_state: readText("buyer_broker_1_state"),
      buyer_broker_1_zip_code: readText("buyer_broker_1_zip_code"),
      buyer_broker_1_is_realtor: readBool("buyer_broker_1_is_realtor"),
      buyer_broker_2_brokerage_firm: readText("buyer_broker_2_brokerage_firm"),
      buyer_broker_2_qualifying_broker_name: readText(
        "buyer_broker_2_qualifying_broker_name",
      ),
      buyer_broker_2_nmrec_license_no: readText("buyer_broker_2_nmrec_license_no"),
      buyer_broker_2_broker_name: readText("buyer_broker_2_broker_name"),
      buyer_broker_2_team_name: readText("buyer_broker_2_team_name"),
      buyer_broker_2_office_phone: readText("buyer_broker_2_office_phone"),
      buyer_broker_2_cell_phone: readText("buyer_broker_2_cell_phone"),
      buyer_broker_2_email: readText("buyer_broker_2_email"),
      buyer_broker_2_address: readText("buyer_broker_2_address"),
      buyer_broker_2_city: readText("buyer_broker_2_city"),
      buyer_broker_2_state: readText("buyer_broker_2_state"),
      buyer_broker_2_zip_code: readText("buyer_broker_2_zip_code"),
      buyer_broker_2_is_realtor: readBool("buyer_broker_2_is_realtor"),
    };

    const payload = {
      property_address: String(formData.get("property_address") ?? "").trim() || null,
      mls_number: String(formData.get("mls_number") ?? "").trim() || null,
      close_date: String(formData.get("close_date") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: String(formData.get("status") ?? "draft"),
      intake_data: intakeData,
    };

    const movingToClosed = payload.status === "closed" && initial.status !== "closed";
    if (movingToClosed) {
      if (!payload.close_date) {
        const useToday = window.confirm(
          "Closing this transaction requires a close date. Use today as the close date?",
        );
        if (!useToday) {
          setError("Set a close date before moving this transaction to Closed.");
          setPending(false);
          return;
        }
        payload.close_date = new Date().toISOString().slice(0, 10);
      } else {
        const confirmed = window.confirm(
          `Confirm this transaction is closed on ${payload.close_date}?`,
        );
        if (!confirmed) {
          setError("Close status change cancelled.");
          setPending(false);
          return;
        }
      }
    }

    const endpoint =
      mode === "create" ? "/api/transactions" : `/api/transactions/${initial.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify(payload),
    });

    setPending(false);

    if (!res.ok) {
      setError("Could not save transaction. Please try again.");
      return;
    }

    if (mode === "create") {
      const body = (await res.json().catch(() => ({}))) as {
        transaction?: { id?: string };
      };
      const id = body.transaction?.id;
      if (id) {
        router.push(`/tc/transactions/${id}`);
        router.refresh();
        return;
      }
      router.push("/tc/transactions");
      router.refresh();
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      className="mt-4 grid grid-cols-1 gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm"
      action={onSubmit}
    >
      <section className="rounded-brand-md border border-neutral-200 p-4">
        <h4 className="font-display text-heading-md text-brand-navy">
          TC / Internal Capture
        </h4>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="Property address"
            name="property_address"
            defaultValue={initial.property_address ?? ""}
            placeholder="4821 Maple Ridge Dr, Austin, TX"
          />
          <Input
            label="MLS number"
            name="mls_number"
            defaultValue={initial.mls_number ?? ""}
            placeholder="123456789"
          />
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Status
            </span>
            <select
              name="status"
              defaultValue={initial.status}
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active listing</option>
              <option value="under_contract">Under contract</option>
              <option value="pending_close">Pending close</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <Input
            label="Close date"
            type="date"
            name="close_date"
            defaultValue={initial.close_date ?? ""}
          />
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="tc_engaged"
              defaultChecked={getBool("tc_engaged", true)}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">TC engaged</span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="follow_up_required"
              defaultChecked={getBool("follow_up_required")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Follow-up required
            </span>
          </label>
          <Input
            label="Review completed by"
            name="tc_review_completed_by"
            defaultValue={getString("tc_review_completed_by")}
          />
          <Input
            label="Review completed date"
            name="tc_review_completed_at"
            type="date"
            defaultValue={getString("tc_review_completed_at")}
          />
          <Input
            label="Source forms received"
            name="source_forms_received"
            defaultValue={getString("source_forms_received")}
            placeholder="NMAR 1100, 2104, other disclosures"
          />
          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              TC representation side
            </span>
            <select
              name="tc_representation_side"
              defaultValue={getString("tc_representation_side")}
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <option value="">Select…</option>
              <option value="seller_listing_broker">Seller / Listing broker</option>
              <option value="buyer_broker">Buyer broker</option>
              <option value="both">Both sides</option>
            </select>
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Follow-up notes
          </span>
          <textarea
            name="follow_up_notes"
            defaultValue={getString("follow_up_notes")}
            rows={3}
            className="w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          />
        </label>
      </section>

      <section className="rounded-brand-md border border-neutral-200 p-4">
        <h4 className="font-display text-heading-md text-brand-navy">
          Seller / Listing Client
        </h4>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="Seller name(s)"
            name="sellers_names"
            defaultValue={getString("sellers_names")}
          />
          <Input
            label="Seller signature date"
            name="seller_signature_date"
            type="date"
            defaultValue={getString("seller_signature_date")}
          />
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="seller_signature_captured"
              defaultChecked={getBool("seller_signature_captured", false)}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Seller signature captured
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="seller_is_nm_broker"
              defaultChecked={getBool("seller_is_nm_broker")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">Seller is NM broker</span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="seller_has_other_listing_agreement"
              defaultChecked={getBool("seller_has_other_listing_agreement")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Seller has other listing agreement
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="conflict_of_interest_disclosed"
              defaultChecked={getBool("conflict_of_interest_disclosed")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Conflict of interest disclosed
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="adverse_material_facts_disclosed"
              defaultChecked={getBool("adverse_material_facts_disclosed")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Adverse material facts disclosed
            </span>
          </label>
          <Input
            label="Conflict explanation"
            name="conflict_of_interest_explanation"
            defaultValue={getString("conflict_of_interest_explanation")}
          />
          <Input
            label="Adverse facts explanation"
            name="adverse_material_facts_explanation"
            defaultValue={getString("adverse_material_facts_explanation")}
          />
          <Input
            label="Property legal description"
            name="property_legal_description"
            defaultValue={getString("property_legal_description")}
          />
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Property type
            </span>
            <select
              name="property_type"
              defaultValue={getString("property_type")}
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <option value="">Select…</option>
              <option value="residential">Residential</option>
              <option value="new_construction">New construction</option>
              <option value="manufactured">Manufactured</option>
              <option value="multi_family">Multi-family</option>
              <option value="modular">Modular</option>
              <option value="offsite_built">Offsite built</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Community type
            </span>
            <select
              name="community_type"
              defaultValue={getString("community_type")}
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <option value="">Select…</option>
              <option value="rural">Rural</option>
              <option value="subdivision">Subdivision</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="mobile_home">Mobile home</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="farm_and_ranch"
              defaultChecked={getBool("farm_and_ranch")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">Farm and ranch</span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="rights_conveyed"
              defaultChecked={getBool("rights_conveyed")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Water / wind / solar rights conveyed
            </span>
          </label>
          <Input
            label="Rights conveyed explanation"
            name="rights_conveyed_explanation"
            defaultValue={getString("rights_conveyed_explanation")}
          />
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Fixture exclusions
          </span>
          <textarea
            name="fixture_exclusions"
            defaultValue={getString("fixture_exclusions")}
            rows={3}
            className="w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          />
        </label>
      </section>

      <BrokerSection
        title="Listing Broker / Seller's Broker(s)"
        prefix="seller_broker_1"
        data={intake}
        subtitle="Seller broker #1"
      />
      <BrokerSection
        title=""
        prefix="seller_broker_2"
        data={intake}
        subtitle="Seller broker #2"
      />

      <section className="rounded-brand-md border border-neutral-200 p-4">
        <h4 className="font-display text-heading-md text-brand-navy">Buyer / Buyer Client</h4>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="Buyer name(s)"
            name="buyers_names"
            defaultValue={getString("buyers_names")}
          />
          <Input
            label="Buyer signature date"
            name="buyer_signature_date"
            type="date"
            defaultValue={getString("buyer_signature_date")}
          />
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="buyer_signature_captured"
              defaultChecked={getBool("buyer_signature_captured", false)}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Buyer signature captured
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              name="buyer_is_nm_broker"
              defaultChecked={getBool("buyer_is_nm_broker")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">Buyer is NM broker</span>
          </label>
          <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2 lg:col-span-2">
            <input
              type="checkbox"
              name="buyer_has_other_broker_agreement"
              defaultChecked={getBool("buyer_has_other_broker_agreement")}
              className="size-4 accent-brand-gold"
            />
            <span className="font-sans text-ui-body text-neutral-900">
              Buyer has another buyer-broker agreement
            </span>
          </label>
        </div>
      </section>

      <BrokerSection
        title="Buyer's Broker(s)"
        prefix="buyer_broker_1"
        data={intake}
        subtitle="Buyer broker #1"
      />
      <BrokerSection
        title=""
        prefix="buyer_broker_2"
        data={intake}
        subtitle="Buyer broker #2"
      />

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          General notes
        </span>
        <textarea
          name="notes"
          defaultValue={initial.notes ?? ""}
          rows={4}
          className="w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          placeholder="Timeline notes, special terms, or reminders..."
        />
      </label>

      {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
      {saved ? <p className="font-sans text-sm text-status-success">Saved.</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="gold" type="submit" loading={pending}>
          {mode === "create" ? "Create transaction" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function BrokerSection({
  title,
  subtitle,
  prefix,
  data,
}: {
  title: string;
  subtitle: string;
  prefix: string;
  data: Record<string, unknown>;
}) {
  const getString = (key: string): string => {
    const v = data[key];
    return typeof v === "string" ? v : "";
  };
  const getBool = (key: string): boolean => {
    const v = data[key];
    return typeof v === "boolean" ? v : false;
  };

  return (
    <section className="rounded-brand-md border border-neutral-200 p-4">
      {title ? (
        <h4 className="font-display text-heading-md text-brand-navy">{title}</h4>
      ) : null}
      <p className={title ? "mt-2 font-sans text-sm text-neutral-600" : "font-sans text-sm text-neutral-600"}>
        {subtitle}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label="Brokerage firm"
          name={`${prefix}_brokerage_firm`}
          defaultValue={getString(`${prefix}_brokerage_firm`)}
        />
        <Input
          label="Qualifying broker name"
          name={`${prefix}_qualifying_broker_name`}
          defaultValue={getString(`${prefix}_qualifying_broker_name`)}
        />
        <Input
          label="NMREC license no."
          name={`${prefix}_nmrec_license_no`}
          defaultValue={getString(`${prefix}_nmrec_license_no`)}
        />
        <Input
          label="Broker name"
          name={`${prefix}_broker_name`}
          defaultValue={getString(`${prefix}_broker_name`)}
        />
        <Input
          label="Team name"
          name={`${prefix}_team_name`}
          defaultValue={getString(`${prefix}_team_name`)}
        />
        <Input
          label="Office phone"
          name={`${prefix}_office_phone`}
          defaultValue={getString(`${prefix}_office_phone`)}
        />
        <Input
          label="Cell phone"
          name={`${prefix}_cell_phone`}
          defaultValue={getString(`${prefix}_cell_phone`)}
        />
        <Input
          label="Email"
          name={`${prefix}_email`}
          defaultValue={getString(`${prefix}_email`)}
        />
        <Input
          label="Address"
          name={`${prefix}_address`}
          defaultValue={getString(`${prefix}_address`)}
        />
        <Input label="City" name={`${prefix}_city`} defaultValue={getString(`${prefix}_city`)} />
        <Input
          label="State"
          name={`${prefix}_state`}
          defaultValue={getString(`${prefix}_state`)}
        />
        <Input
          label="Zip code"
          name={`${prefix}_zip_code`}
          defaultValue={getString(`${prefix}_zip_code`)}
        />
        <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2 lg:col-span-2">
          <input
            type="checkbox"
            name={`${prefix}_is_realtor`}
            defaultChecked={getBool(`${prefix}_is_realtor`)}
            className="size-4 accent-brand-gold"
          />
          <span className="font-sans text-ui-body text-neutral-900">Broker is REALTOR</span>
        </label>
      </div>
    </section>
  );
}

import { getPropertyByAddress } from "@/lib/clerk/client";
import { sendEmail } from "@/lib/email/client";
import { auditIntegrationAction } from "@/lib/integrations/audit";
import { extractDocumentWithClaudeFromBuffer } from "@/lib/inngest/first-pass/extract-document";
import { mergeAndScore } from "@/lib/inngest/first-pass/merge";
import type { ExtractedShape } from "@/lib/inngest/first-pass/merge";
import { parseUsAddress } from "@/lib/inngest/first-pass/parse-address";
import { inngest } from "@/lib/inngest/client";
import { getListingByMlsNumber } from "@/lib/mls/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type TransactionOpenedPayload = {
  transactionId: string;
  tenantId: string;
  mlsNumber: string;
  documentIds: string[];
};

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

export default inngest.createFunction(
  {
    id: "nexa.ai-first-pass",
    name: "AI First Pass",
    retries: 2,
  },
  { event: "transaction.opened" },
  async ({ event, step }) => {
    const { transactionId, tenantId, mlsNumber, documentIds } =
      event.data as TransactionOpenedPayload;

    await step.run("audit-start", async () => {
      await auditIntegrationAction({
        tenantId,
        transactionId,
        provider: "first_pass",
        operation: "workflow.start",
        detail: { mlsNumber, documentCount: documentIds?.length ?? 0 },
      });
    });

    const txRow = await step.run("load-transaction", async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("id, property_address, transaction_type, property_data")
        .eq("id", transactionId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error || !data) {
        throw new Error(`transaction_not_found:${error?.message ?? "unknown"}`);
      }
      return data;
    });

    await step.run("step-1-mls", async () => {
      try {
        const listing = await getListingByMlsNumber({
          tenantId,
          mlsNumber,
          actorId: null,
        });
        const supabase = createServiceRoleClient();
        const cur = (txRow.property_data as Record<string, unknown> | null) ?? {};
        const merged = {
          ...cur,
          mls: listing,
          mls_fetched_at: new Date().toISOString(),
        };
        await supabase
          .from("transactions")
          .update({ property_data: merged })
          .eq("id", transactionId)
          .eq("tenant_id", tenantId);

        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.mls",
          detail: { ok: true },
        });
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.mls",
          detail: { ok: false, error: msg },
        });
        return { ok: false as const, error: msg };
      }
    });

    await step.run("step-2-attom", async () => {
      const supabaseFresh = createServiceRoleClient();
      const { data: freshTx } = await supabaseFresh
        .from("transactions")
        .select("property_address, property_data")
        .eq("id", transactionId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const parsed =
        parseUsAddress(freshTx?.property_address ?? null) ??
        (() => {
          try {
            const mls = (
              (freshTx?.property_data as Record<string, unknown> | null)?.mls as {
                value?: Record<string, unknown>[];
              }
            )?.value?.[0];
            if (!mls) return null;
            const line1 =
              String(mls.UnparsedAddress ?? "").trim() ||
              [
                mls.StreetNumber,
                mls.StreetName,
                mls.StreetSuffix ?? mls.StreetDirSuffix,
              ]
                .filter(Boolean)
                .join(" ");
            const city = String(mls.City ?? "").trim();
            const state = String(mls.StateOrProvince ?? "").trim();
            const postalCode = String(mls.PostalCode ?? "").trim();
            if (!line1 || !city || !state || !postalCode) return null;
            return { line1, city, state, postalCode };
          } catch {
            return null;
          }
        })();

      if (!parsed) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.attom",
          detail: { skipped: true, reason: "no_parseable_address" },
        });
        return { ok: false as const, skipped: true };
      }

      try {
        const attom = await getPropertyByAddress({
          tenantId,
          line1: parsed.line1,
          city: parsed.city,
          state: parsed.state,
          postalCode: parsed.postalCode,
          actorId: null,
        });
        const supabase = createServiceRoleClient();
        const { data: latest } = await supabase
          .from("transactions")
          .select("property_data")
          .eq("id", transactionId)
          .eq("tenant_id", tenantId)
          .single();

        const cur = (latest?.property_data as Record<string, unknown> | null) ?? {};
        const merged = {
          ...cur,
          attom,
          attom_fetched_at: new Date().toISOString(),
        };
        await supabase
          .from("transactions")
          .update({ property_data: merged })
          .eq("id", transactionId)
          .eq("tenant_id", tenantId);

        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.attom",
          detail: { ok: true },
        });
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.attom",
          detail: { ok: false, error: msg },
        });
        return { ok: false as const, error: msg };
      }
    });

    const docExtractions = await step.run("step-3-documents", async () => {
      const supabase = createServiceRoleClient();
      const out: ExtractedShape[] = [];

      for (const docId of documentIds ?? []) {
        try {
          const { data: doc, error: dErr } = await supabase
            .from("documents")
            .select("id, storage_path, mime_type, file_name, tenant_id, transaction_id")
            .eq("id", docId)
            .eq("tenant_id", tenantId)
            .eq("transaction_id", transactionId)
            .maybeSingle();

          if (dErr || !doc?.storage_path) {
            await auditIntegrationAction({
              tenantId,
              transactionId,
              provider: "first_pass",
              operation: "step.document",
              detail: {
                documentId: docId,
                ok: false,
                error: dErr?.message ?? "missing_row_or_storage_path",
              },
            });
            await supabase
              .from("documents")
              .update({
                ai_extracted: {
                  error: dErr?.message ?? "missing_row_or_storage_path",
                },
              })
              .eq("id", docId)
              .eq("tenant_id", tenantId);
            continue;
          }

          const dl = await supabase.storage
            .from(BUCKET)
            .download(doc.storage_path);

          if (dl.error || !dl.data) {
            const errMsg = dl.error?.message ?? "download_failed";
            await supabase
              .from("documents")
              .update({ ai_extracted: { error: errMsg } })
              .eq("id", docId)
              .eq("tenant_id", tenantId);
            await auditIntegrationAction({
              tenantId,
              transactionId,
              provider: "first_pass",
              operation: "step.document",
              detail: { documentId: docId, ok: false, error: errMsg },
            });
            continue;
          }

          const buf = Buffer.from(await dl.data.arrayBuffer());
          const mime = doc.mime_type ?? "application/octet-stream";
          const res = await extractDocumentWithClaudeFromBuffer({
            buffer: buf,
            mimeType: mime,
            fileName: doc.file_name ?? "document",
          });

          if (!res.ok) {
            await supabase
              .from("documents")
              .update({ ai_extracted: { error: res.error } })
              .eq("id", docId)
              .eq("tenant_id", tenantId);
            await auditIntegrationAction({
              tenantId,
              transactionId,
              provider: "first_pass",
              operation: "step.document",
              detail: { documentId: docId, ok: false, error: res.error },
            });
            continue;
          }

          await supabase
            .from("documents")
            .update({ ai_extracted: res.data as Record<string, unknown> })
            .eq("id", docId)
            .eq("tenant_id", tenantId);

          out.push(res.data);
          await auditIntegrationAction({
            tenantId,
            transactionId,
            provider: "first_pass",
            operation: "step.document",
            detail: { documentId: docId, ok: true },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await auditIntegrationAction({
            tenantId,
            transactionId,
            provider: "first_pass",
            operation: "step.document",
            detail: { documentId: docId, ok: false, error: msg },
          });
        }
      }

      return out;
    });

    const scoresPayload = await step.run("step-4-merge", async () => {
      const supabase = createServiceRoleClient();
      const { data: tr, error } = await supabase
        .from("transactions")
        .select("property_data")
        .eq("id", transactionId)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !tr) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.merge",
          detail: { ok: false, error: error?.message ?? "no_row" },
        });
        throw new Error("merge_load_failed");
      }

      const { first_pass_data, scores } = mergeAndScore({
        propertyData: (tr.property_data as Record<string, unknown>) ?? {},
        docExtractions,
      });

      const scoresJson = {
        sections: scores.sections,
        overallPercent: scores.overallPercent,
      };

      await supabase
        .from("transactions")
        .update({
          first_pass_data: first_pass_data as Record<string, unknown>,
          first_pass_scores: scoresJson as Record<string, unknown>,
        })
        .eq("id", transactionId)
        .eq("tenant_id", tenantId);

      await auditIntegrationAction({
        tenantId,
        transactionId,
        provider: "first_pass",
        operation: "step.merge",
        detail: { ok: true, overallPercent: scores.overallPercent },
      });

      return scoresJson;
    });

    await step.run("step-5-checklist", async () => {
      const supabase = createServiceRoleClient();
      const txType = txRow.transaction_type;

      const { data: templates, error: tErr } = await supabase
        .from("checklist_templates")
        .select("id, name, template_items, transaction_type")
        .eq("tenant_id", tenantId);

      if (tErr || !templates?.length) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.checklist",
          detail: { ok: false, error: "no_templates", message: tErr?.message },
        });
        return { ok: false as const };
      }

      const exact =
        txType &&
        templates.find((t) => (t.transaction_type as string | null) === txType);
      const fallback = templates.find((t) => t.transaction_type == null);
      const template = exact ?? fallback;

      if (!template) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.checklist",
          detail: { ok: false, error: "no_matching_template", transaction_type: txType },
        });
        return { ok: false as const };
      }

      const { data: checklist, error: cErr } = await supabase
        .from("checklists")
        .insert({
          tenant_id: tenantId,
          transaction_id: transactionId,
          name: template.name,
        })
        .select("id")
        .single();

      if (cErr || !checklist) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.checklist",
          detail: { ok: false, error: cErr?.message },
        });
        return { ok: false as const };
      }

      const items = (template.template_items as { title: string; sort_order?: number }[]) ?? [];
      let sort = 0;
      for (const item of items) {
        await supabase.from("checklist_items").insert({
          tenant_id: tenantId,
          transaction_id: transactionId,
          checklist_id: checklist.id,
          title: item.title,
          sort_order: item.sort_order ?? sort++,
          completed: false,
        });
      }

      await auditIntegrationAction({
        tenantId,
        transactionId,
        provider: "first_pass",
        operation: "step.checklist",
        detail: {
          ok: true,
          checklistId: checklist.id,
          templateId: template.id,
          items: items.length,
        },
      });

      return { ok: true as const, checklistId: checklist.id };
    });

    await step.run("step-6-notify", async () => {
      const supabase = createServiceRoleClient();
      const pct = scoresPayload.overallPercent ?? 0;

      try {
        await supabase.from("messages").insert({
          tenant_id: tenantId,
          transaction_id: transactionId,
          body: `AI First Pass finished. Confidence (overall): ${pct}%.`,
          sender_user_id: null,
        });
      } catch (e) {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.notify.message_failed",
          detail: { error: String(e) },
        });
      }

      const { data: tcs } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("tenant_id", tenantId)
        .eq("role", "tc");

      const from = process.env.EMAIL_FROM?.trim();
      if (from && tcs?.length) {
        for (const tc of tcs) {
          if (!tc.email) continue;
          try {
            await sendEmail({
              tenantId,
              From: from,
              To: tc.email,
              Subject: `First pass ready · ${transactionId.slice(0, 8)}…`,
              HtmlBody: `<p>AI First Pass completed for transaction <strong>${transactionId}</strong>.</p><p>Overall confidence: <strong>${pct}%</strong>.</p>`,
              actorId: null,
            });
          } catch (e) {
            await auditIntegrationAction({
              tenantId,
              transactionId,
              provider: "first_pass",
              operation: "step.notify.email_failed",
              detail: { to: tc.email, error: String(e) },
            });
          }
        }
      } else {
        await auditIntegrationAction({
          tenantId,
          transactionId,
          provider: "first_pass",
          operation: "step.notify",
          detail: { skipped_email: true, reason: !from ? "no_EMAIL_FROM" : "no_tc_users" },
        });
      }

      await auditIntegrationAction({
        tenantId,
        transactionId,
        provider: "first_pass",
        operation: "workflow.complete",
        detail: { overallPercent: pct },
      });

      return { ok: true as const };
    });

    return {
      transactionId,
      overallPercent: scoresPayload.overallPercent,
    };
  },
);

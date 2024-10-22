import { writeToString } from "@fast-csv/format";
import { download } from "@midday/supabase/storage";
import { eventTrigger } from "@trigger.dev/sdk";
import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_EXPORT,
  name: "Transactions - Export",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_EXPORT,
    schema: z.object({
      transactionIds: z.array(z.string()),
      teamId: z.string(),
      locale: z.string(),
    }),
  }),
  integrations: { supabase },
  /**
   * Exports transactions to a ZIP file containing a CSV and attachments.
   *
   * @param payload - The job payload containing export configuration.
   * @param payload.transactionIds - Array of transaction IDs to export.
   * @param payload.teamId - The ID of the team exporting the transactions.
   * @param payload.locale - The locale to use for number formatting.
   * @param io - The I/O object provided by the job runner for integration access.
   *
   * @throws {Error} If there's an issue with database queries or file operations.
   */
  run: async (payload, io) => {
    const client = await io.supabase.client;

    const { transactionIds, teamId, locale } = payload;

    const filePath = `export-${new Date().toISOString()}`;

    const path = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    /**
     * Creates and updates a status object to track export progress.
     * @type {StatusObject}
     */
    const generateExport = await io.createStatus("generate-export-start", {
      label: "Generating export",
      state: "loading",
      data: {
        progress: 10,
      },
    });

    /**
     * Fetches transaction data from the database.
     * @type {QueryResult}
     */
    const { data, count } = await client
      .from("transactions")
      .select(
        `
        id,
        date,
        name,
        amount,
        note,
        balance,
        currency,
        vat:calculated_vat,
        attachments:transaction_attachments(*),
        category:transaction_categories(id, name, description),
        bank_account:bank_accounts(id, name)
      `,
        { count: "exact" },
      )
      .in("id", transactionIds)
      .eq("team_id", teamId);

    await generateExport.update("generate-export-transaction", {
      state: "loading",
      data: {
        progress: 30,
      },
    });

    await generateExport.update("generate-export-attachments-start", {
      state: "loading",
      data: {
        progress: 50,
      },
    });

    /**
     * Fetches and processes attachments for each transaction.
     * @type {Promise<PromiseSettledResult<Attachment>[]>}
     */
    const attachments = await Promise.allSettled(
      data?.flatMap((transaction, idx) => {
        const rowId = idx + 1;

        return transaction?.attachments?.map(
          /**
           * Processes a single attachment.
           * @param {Object} attachment - The attachment object.
           * @param {number} idx2 - The index of the attachment within the transaction.
           * @returns {Promise<Attachment>} A promise that resolves to the processed attachment.
           */
          async (attachment, idx2: number) => {
            const extension = attachment.name?.split(".").pop() ?? "";
            const name =
              idx2 > 0
                ? `${rowId}_${idx2}.${extension}`
                : `${rowId}.${extension}`;

            const { data } = await download(client as any, {
              bucket: "vault",
              path: attachment?.path?.join("/") ?? "",
            });

            return {
              id: transaction.id,
              name,
              blob: data,
            };
          },
        );
      }) ?? [],
    );

    await generateExport.update("generate-export-attachments-end", {
      state: "loading",
      data: {
        progress: 70,
      },
    });

    await generateExport.update("generate-export-csv-start", {
      state: "loading",
      data: {
        progress: 75,
      },
    });

    /**
     * Formats transaction data into rows for CSV export.
     * @type {Array<Array<string|null>>}
     */
    const rows = data
      ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((transaction, idx) => [
        transaction?.id,
        transaction.date,
        transaction.name,
        Intl.NumberFormat(locale, {
          style: "currency",
          currency: transaction.currency,
        }).format(transaction.amount),
        transaction?.vat
          ? Intl.NumberFormat(locale, {
              style: "currency",
              currency: transaction.currency,
            }).format(transaction?.vat)
          : "",
        transaction?.category?.name ?? "",
        transaction?.category?.description ?? "",
        transaction?.attachments?.length > 0 ? `${idx + 1}.pdf` : null,
        transaction?.attachments?.length > 0 ? "✔️" : "❌",
        transaction?.balance ?? "",
        transaction?.bank_account?.name ?? "",
        transaction?.note ?? "",
      ]);

    /**
     * Generates CSV content from the formatted rows.
     * @type {Promise<string>}
     */
    const csv = await writeToString(rows ?? [], {
      headers: [
        "ID",
        "Date",
        "Description",
        "Amount",
        "VAT",
        "Category",
        "Category description",
        "Attachment name",
        "Attachment",
        "Balance",
        "Account",
        "Note",
      ],
    });

    await generateExport.update("generate-export-csv-end", {
      state: "loading",
      data: {
        progress: 80,
      },
    });

    await generateExport.update("generate-export-zip", {
      state: "loading",
      data: {
        progress: 85,
      },
    });

    /**
     * Creates a ZIP file containing the CSV and attachments.
     */
    const zipFileWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipFileWriter);

    zipWriter.add("transactions.csv", new TextReader(csv));
    attachments?.forEach((attachment) => {
      if (attachment.status === "fulfilled" && attachment.value?.blob) {
        zipWriter.add(
          attachment.value.name,
          new BlobReader(attachment.value.blob),
        );
      }
    });

    const zip = await zipWriter.close();

    await generateExport.update("generate-export-upload", {
      state: "loading",
      data: {
        progress: 90,
      },
    });

    /**
     * Uploads the ZIP file to storage.
     */
    await client.storage
      .from("vault")
      .upload(`${path}/${fileName}`, await zip.arrayBuffer(), {
        upsert: true,
        contentType: "application/zip",
      });

    revalidateTag(`vault_${teamId}`);

    /**
     * Updates the final status of the export process.
     */
    await generateExport.update("generate-export-done", {
      state: "success",
      data: {
        filePath,
        fileName,
        progress: 100,
        totalItems: count,
      },
    });
  },
});

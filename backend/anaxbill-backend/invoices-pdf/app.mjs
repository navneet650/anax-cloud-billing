import { getCompanyId } from "../common/auth.mjs";
import { getItem, TABLES } from "../common/db.mjs";
import { ok, badRequest, notFound, handleError } from "../common/response.mjs";
import { generateInvoicePdf } from "../common/pdf.mjs";
import { uploadPdf, getPdfUrl } from "../common/s3.mjs";

export async function handler(event) {
  try {
    const { companyId } = getCompanyId(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath.replace(/^\/[^/]+/, "") || "/";

    if (method === "OPTIONS") return ok({});

    const pathParts = path.split("/").filter(Boolean);
    if (method !== "POST" || pathParts[0] !== "invoices" || pathParts[2] !== "pdf" || !pathParts[1]) {
      return badRequest(`Unsupported ${method} ${path}`);
    }

    const invoiceId = pathParts[1];

    const invoice = await getItem(TABLES.INVOICES, { companyId, invoiceId });
    if (!invoice) return notFound("Invoice not found");

    const settings = await getItem(TABLES.SETTINGS, { companyId }) || {};
    const customer = invoice.customerId
      ? await getItem(TABLES.CUSTOMERS, { companyId, customerId: invoice.customerId })
      : null;

    const pdfBuffer = await generateInvoicePdf(invoice, settings, customer);

    const s3Key = `pdfs/${companyId}/${invoice.invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
    await uploadPdf(s3Key, pdfBuffer);

    const url = await getPdfUrl(s3Key, 3600);

    return ok({
      invoiceNumber: invoice.invoiceNumber,
      s3Key,
      url,
      sizeBytes: pdfBuffer.length,
      expiresIn: 3600,
    });
  } catch (err) {
    return handleError(err);
  }
}

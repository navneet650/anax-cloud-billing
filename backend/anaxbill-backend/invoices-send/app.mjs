import { getCompanyId } from "../common/auth.mjs";
import { getItem, updateItem, TABLES } from "../common/db.mjs";
import { ok, badRequest, notFound, handleError } from "../common/response.mjs";
import { generateInvoicePdf } from "../common/pdf.mjs";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "ap-south-1" });
const FROM_EMAIL = process.env.SES_FROM_EMAIL;

function buildRawEmail({ from, to, subject, htmlBody, pdfBuffer, pdfFilename }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = [];

  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push(``);
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/html; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: 7bit`);
  lines.push(``);
  lines.push(htmlBody);
  lines.push(``);
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: application/pdf; name="${pdfFilename}"`);
  lines.push(`Content-Transfer-Encoding: base64`);
  lines.push(`Content-Disposition: attachment; filename="${pdfFilename}"`);
  lines.push(``);
  lines.push(pdfBuffer.toString("base64"));
  lines.push(``);
  lines.push(`--${boundary}--`);

  return Buffer.from(lines.join("\r\n"), "utf-8");
}

export async function handler(event) {
  try {
    const { companyId, email: senderEmail } = getCompanyId(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath.replace(/^\/[^/]+/, "") || "/";

    if (method === "OPTIONS") return ok({});

    const pathParts = path.split("/").filter(Boolean);
    if (method !== "POST" || pathParts[0] !== "invoices" || pathParts[2] !== "send" || !pathParts[1]) {
      return badRequest(`Unsupported ${method} ${path}`);
    }

    const invoiceId = pathParts[1];

    const invoice = await getItem(TABLES.INVOICES, { companyId, invoiceId });
    if (!invoice) return notFound("Invoice not found");

    const settings = await getItem(TABLES.SETTINGS, { companyId }) || {};
    const customer = invoice.customerId
      ? await getItem(TABLES.CUSTOMERS, { companyId, customerId: invoice.customerId })
      : null;

    const body = JSON.parse(event.body || "{}");
    const toEmail = body.to || invoice.customerEmail || customer?.email;
    if (!toEmail) return badRequest("No recipient email (set customerEmail on invoice or pass {to})");

    const pdfBuffer = await generateInvoicePdf(invoice, settings, customer);
    const pdfFilename = `${invoice.invoiceNumber}.pdf`;

    const businessName = settings.businessName || "AnaxBill";
    const subject = body.subject || `Invoice ${invoice.invoiceNumber} from ${businessName}`;
    const htmlBody = body.message || `
      <html><body style="font-family:Helvetica,Arial,sans-serif;color:#1f2937;font-size:14px;">
        <p>Dear ${invoice.customerName || "Customer"},</p>
        <p>Please find attached invoice <b>${invoice.invoiceNumber}</b> dated ${invoice.date}.</p>
        <p><b>Amount due:</b> ${invoice.currency} ${Number(invoice.grandTotal).toFixed(2)}</p>
        <p><b>Due date:</b> ${invoice.dueDate || "On receipt"}</p>
        <p>Please make the payment to the bank account listed on the invoice.</p>
        <p>Thank you for your business.</p>
        <p>Regards,<br>${businessName}</p>
      </body></html>
    `;

    const raw = buildRawEmail({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      htmlBody,
      pdfBuffer,
      pdfFilename,
    });

    const result = await ses.send(new SendRawEmailCommand({
      RawMessage: { Data: raw },
    }));

    await updateItem(TABLES.INVOICES, { companyId, invoiceId }, {
      status: "Sent",
      sentAt: new Date().toISOString(),
      sentTo: toEmail,
      updatedAt: new Date().toISOString(),
    });

    return ok({
      sent: true,
      messageId: result.MessageId,
      to: toEmail,
      from: FROM_EMAIL,
      invoiceNumber: invoice.invoiceNumber,
      pdfSizeBytes: pdfBuffer.length,
    });
  } catch (err) {
    return handleError(err);
  }
}

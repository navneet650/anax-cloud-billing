import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fillTemplate(html, data) {
  html = html.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, key, truthy, falsy) => (data[key] ? truthy : (falsy || ""))
  );
  html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, inner) => {
    const arr = data[key] || [];
    return arr.map((item, i) => {
      let row = inner;
      row = row.replace(/\{\{this\.(\w+)\}\}/g, (_, f) => item[f] ?? "");
      row = row.replace(/\{\{this\}\}/g, item);
      row = row.replace(/\{\{@index\}\}/g, i + 1);
      return row;
    }).join("");
  });
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
  return html;
}

export async function generateInvoicePdf(invoice, settings, customer) {
  const templatePath = path.join(process.cwd(), "pdf", "template.html");
  const cssPath = path.join(process.cwd(), "pdf", "styles.css");
  const template = fs.readFileSync(templatePath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");

  const isIntraState = invoice.isIntraState;

  const businessAddress = [
    settings.address,
    settings.city,
    settings.state,
    settings.pincode,
  ].filter(Boolean).join(", ");

  const customerAddress = customer
    ? [
        customer.addressLine1,
        customer.addressLine2,
        [customer.city, customer.state, customer.pincode].filter(Boolean).join(", "),
        customer.country,
      ].filter(Boolean).join(", ")
    : "";

  const view = {
    businessName: settings.businessName || "",
    businessAddress,
    gstin: settings.gstin || "",
    phone: settings.phone || "",
    email: settings.email || "",
    website: settings.website || "",
    logo: settings.logoUrl || "",

    invoiceNumber: invoice.invoiceNumber || "",
    invoiceDate: invoice.date || "",
    dueDate: invoice.dueDate || "",
    currency: invoice.currency || "INR",
    poNumber: invoice.poNumber || "",
    placeOfSupply: invoice.placeOfSupply || "",

    customerName: invoice.customerName || "",
    customerContact: customer?.contactPerson || "",
    customerAddress,
    customerGstin: invoice.customerGstin || "",
    customerEmail: invoice.customerEmail || "",
    customerMobile: customer?.mobile || "",

    items: (invoice.items || []).map((it, i) => ({
      no: i + 1,
      description: it.description,
      hsnSac: it.hsnSac || "—",
      quantity: it.quantity,
      unitPrice: fmt(it.unitPrice),
      taxRate: it.taxRate,
      amount: fmt(it.quantity * it.unitPrice * (1 + it.taxRate / 100)),
    })),

    subtotal: fmt(invoice.subtotal),
    cgst: fmt(invoice.cgst),
    sgst: fmt(invoice.sgst),
    igst: fmt(invoice.igst),
    grandTotal: fmt(invoice.grandTotal),
    isIntraState,

    invoiceDescription: invoice.invoiceDescription || "",

    bankName: settings.bankName || "",
    bankBranch: settings.bankBranch || "",
    accountNumber: settings.accountNumber || "",
    ifsc: settings.ifsc || "",

    terms: (settings.termsAndConditions || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^\d+\.\s*/, "")),
  };

  let html = fillTemplate(template, view);
  html = html.replace("</head>", `<style>${css}</style></head>`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

function fmtDate(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate.includes("T") ? isoDate : isoDate + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return isoDate;
  }
}

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function fillTemplate(html, data) {
  // {{#unless X}}...{{/unless}}
  html = html.replace(
    /\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key, body) => (data[key] ? "" : body)
  );

  // {{#if X}}...{{else}}...{{/if}}
  html = html.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, key, truthy, falsy) => (data[key] ? truthy : (falsy || ""))
  );

  // {{#each X}}...{{/each}}
  html = html.replace(
    /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, key, inner) => {
      const arr = data[key] || [];
      return arr
        .map((item, i) => {
          let row = inner;
          row = row.replace(/\{\{this\.(\w+)\}\}/g, (_, f) => item[f] ?? "");
          row = row.replace(/\{\{this\}\}/g, item);
          row = row.replace(/\{\{@index\}\}/g, i + 1);
          return row;
        })
        .join("");
    }
  );

  // {{var}}
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
  return html;
}

function amountInWords(amount) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty",
    "Seventy", "Eighty", "Ninety"];

  const two = (n) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
  const three = (n) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h ? ones[h] + " Hundred" + (rest ? " " : "") : "") + (rest ? two(rest) : "");
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let out = "";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  if (crore) out += three(crore) + " Crore ";
  if (lakh) out += three(lakh) + " Lakh ";
  if (thousand) out += three(thousand) + " Thousand ";
  if (rest) out += three(rest);

  out = "Indian Rupees " + out.trim();
  if (paise) out += " and " + two(paise) + " Paise";
  return out + " Only";
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
    : [invoice.customerAddressLine1, invoice.customerAddressLine2, invoice.customerCity, invoice.customerState, invoice.customerPincode]
        .filter(Boolean).join(", ");

  const items = (invoice.items || []).map((it, i) => ({
    no: i + 1,
    description: it.description,
    hsnSac: it.hsnSac || "—",
    quantity: it.quantity,
    unitPrice: fmt(it.unitPrice),
    taxRate: it.taxRate,
    taxableValue: fmt(it.quantity * it.unitPrice),
  }));

  // Tax rows per rate
  const rateGroups = {};
  for (const it of invoice.items || []) {
    const rate = Number(it.taxRate) || 0;
    if (!rateGroups[rate]) rateGroups[rate] = 0;
    rateGroups[rate] += (it.quantity * it.unitPrice * rate) / 100;
  }

  const taxRows = [];
  for (const [rateStr, taxAmt] of Object.entries(rateGroups)) {
    const rate = Number(rateStr);
    if (rate === 0) continue;
    if (isIntraState) {
      taxRows.push({ label: `CGST ${rate / 2}%`, amount: fmt(taxAmt / 2) });
      taxRows.push({ label: `SGST ${rate / 2}%`, amount: fmt(taxAmt / 2) });
    } else {
      taxRows.push({ label: `IGST ${rate}%`, amount: fmt(taxAmt) });
    }
  }

  const firstRate = (invoice.items && invoice.items[0]?.taxRate) || 18;
  const cgstRate = isIntraState ? firstRate / 2 : 0;
  const sgstRate = isIntraState ? firstRate / 2 : 0;
  const igstRate = isIntraState ? 0 : firstRate;

  const grandTotal = Number(invoice.grandTotal) || 0;

  const view = {
    businessName: settings.businessName || "",
    businessAddress,
    gstin: settings.gstin || "",
    phone: settings.phone || "",
    email: settings.email || "",
    website: settings.website || "",
    logo: settings.logoUrl || settings.logo || "",

    invoiceNumber: invoice.invoiceNumber || "",
    invoiceDate: fmtDate(invoice.date),
    dueDate: fmtDate(invoice.dueDate),
    currency: invoice.currency || "INR",
    poNumber: invoice.poNumber || "—",
    placeOfSupply: invoice.placeOfSupply || "",

    customerName: invoice.customerName || "",
    customerContact: customer?.contactPerson || "",
    customerAddress,
    customerGstin: invoice.customerGstin || "",
    customerEmail: invoice.customerEmail || "",
    customerMobile: customer?.mobile || "",

    items,
    taxRows,

    subtotal: fmt(invoice.subtotal),
    cgst: fmt(invoice.cgst),
    sgst: fmt(invoice.sgst),
    igst: fmt(invoice.igst),
    grandTotal: fmt(grandTotal),
    cgstRate,
    sgstRate,
    igstRate,
    isIntraState,

    amountInWords: amountInWords(grandTotal),
    signatureRequired: settings.signatureRequired === true,

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
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}

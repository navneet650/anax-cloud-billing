import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ---------- template engine ----------
function fillTemplate(html, data) {
  // Handle {{#unless X}}...{{/unless}}
  html = html.replace(
    /\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key, body) => (data[key] ? "" : body)
  );

  // Handle {{#if X}}...{{else}}...{{/if}}
  html = html.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, key, truthy, falsy) => (data[key] ? truthy : (falsy || ""))
  );

  // Handle {{#each X}}...{{/each}}
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

  // Handle plain {{var}}
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
  return html;
}

// ---------- amount in words (Indian numbering) ----------
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

// ---------- main ----------
const inputFile = process.argv[2] || "sample-inv-1017.json";
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// Compute totals
const subtotal = data.items.reduce(
  (s, it) => s + it.quantity * it.unitPrice,
  0
);
const taxTotal = data.items.reduce(
  (s, it) => s + (it.quantity * it.unitPrice * it.taxRate) / 100,
  0
);

// Determine intra/inter state
const supplierState = (data.gstin || "").trim().slice(0, 2);
const customerState = (data.customerGstin || "").trim().slice(0, 2);
const posState = (data.placeOfSupply || "").trim().match(/^\d{2}/)?.[0] || "";
const isIntraState = supplierState && customerState
  ? supplierState === customerState
  : supplierState === posState;

// Compute per-item taxable values
const items = data.items.map((it, i) => ({
  no: i + 1,
  description: it.description,
  hsnSac: it.hsnSac || "-",
  quantity: it.quantity,
  unitPrice: fmt(it.unitPrice),
  taxRate: it.taxRate,
  taxableValue: fmt(it.quantity * it.unitPrice),
}));

// Compute tax rows (as separate items inside the items table, V5-style)
// Group by unique tax rate
const rateGroups = {};
for (const it of data.items) {
  const rate = Number(it.taxRate) || 0;
  if (!rateGroups[rate]) rateGroups[rate] = 0;
  rateGroups[rate] += (it.quantity * it.unitPrice * rate) / 100;
}

const taxRows = [];
for (const [rateStr, taxAmt] of Object.entries(rateGroups)) {
  const rate = Number(rateStr);
  if (rate === 0) continue;

  if (isIntraState) {
    taxRows.push({
      label: `CGST ${rate / 2}%`,
      amount: fmt(taxAmt / 2),
    });
    taxRows.push({
      label: `SGST ${rate / 2}%`,
      amount: fmt(taxAmt / 2),
    });
  } else {
    taxRows.push({
      label: `IGST ${rate}%`,
      amount: fmt(taxAmt),
    });
  }
}

// Compute rate strings for summary labels
const firstRate = data.items[0]?.taxRate || 18;
const cgstRate = isIntraState ? firstRate / 2 : 0;
const sgstRate = isIntraState ? firstRate / 2 : 0;
const igstRate = isIntraState ? 0 : firstRate;

const grandTotal = subtotal + taxTotal;

const view = {
  ...data,
  items,
  taxRows,
  subtotal: fmt(subtotal),
  cgst: fmt(isIntraState ? taxTotal / 2 : 0),
  sgst: fmt(isIntraState ? taxTotal / 2 : 0),
  igst: fmt(isIntraState ? 0 : taxTotal),
  grandTotal: fmt(grandTotal),
  cgstRate,
  sgstRate,
  igstRate,
  isIntraState,
  amountInWords: amountInWords(grandTotal),
  signatureRequired: data.signatureRequired === true,
  terms: (data.termsAndConditions || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+\.\s*/, "")),
  customerAddress: [
    data.customerAddressLine1,
    data.customerAddressLine2,
    [data.customerCity, data.customerState, data.customerPincode].filter(Boolean).join(", "),
    data.customerCountry,
  ].filter(Boolean).join(", "),
};

// Render
const template = fs.readFileSync("template.html", "utf8");
const html = fillTemplate(template, view);
const outHtml = path.resolve("output.html");
fs.writeFileSync(outHtml, html);

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--disable-http-cache", "--disk-cache-size=1"],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.goto("file://" + outHtml, { waitUntil: "networkidle0" });

await page.pdf({
  path: "output.pdf",
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
});

await browser.close();
console.log("✅ Wrote " + path.resolve("output.pdf"));

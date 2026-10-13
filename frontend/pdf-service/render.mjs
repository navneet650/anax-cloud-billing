import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

// ---------- helpers ----------
const fmt = (n) =>
  Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fillTemplate(html, data) {
  // Handle {{#if X}}...{{else}}...{{/if}} FIRST (with else support)
  html = html.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, key, truthy, falsy) => (data[key] ? truthy : (falsy || ""))
  );

  // Then {{#each X}}...{{/each}}
  html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, inner) => {
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
  });

  // Finally plain {{var}}
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");

  return html;
}

// ---------- load data ----------
const inputFile = process.argv[2] || "sample-inv-1017.json";
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// ---------- compute derived ----------
const subtotal = data.items.reduce(
  (s, it) => s + it.quantity * it.unitPrice, 0
);
const taxTotal = data.items.reduce(
  (s, it) => s + (it.quantity * it.unitPrice * it.taxRate) / 100, 0
);

const supplierState = (data.gstin || "").trim().slice(0, 2);
const customerState = (data.customerGstin || "").trim().slice(0, 2);
const posState = (data.placeOfSupply || "").trim().match(/^\d{2}/)?.[0] || "";

// If customer has a GSTIN, compare supplier vs customer state.
// Otherwise fall back to place-of-supply.
const isIntraState = /^\d{2}$/.test(supplierState) && (
  /^\d{2}$/.test(customerState)
    ? supplierState === customerState
    : supplierState === posState
);

console.log("Tax logic → supplier:", supplierState,
            "customer:", customerState,
            "PoS:", posState,
            "→ isIntraState:", isIntraState);

const view = {
  ...data,
  items: data.items.map((it, i) => ({
    no: i + 1,
    description: it.description,
    hsnSac: it.hsnSac || "—",
    quantity: it.quantity,
    unitPrice: fmt(it.unitPrice),
    taxRate: it.taxRate,
    amount: fmt(it.quantity * it.unitPrice * (1 + it.taxRate / 100)),
  })),
  subtotal: fmt(subtotal),
  cgst: fmt(isIntraState ? taxTotal / 2 : 0),
  sgst: fmt(isIntraState ? taxTotal / 2 : 0),
  igst: fmt(isIntraState ? 0 : taxTotal),
  grandTotal: fmt(subtotal + taxTotal),
  isIntraState,
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

// ---------- render ----------
const template = fs.readFileSync(path.resolve("template.html"), "utf8");
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

const outPdf = path.resolve("output.pdf");
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
});

await browser.close();
console.log("✅ Wrote " + outPdf);

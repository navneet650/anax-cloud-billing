export function computeTax(items, supplierGstin, customerGstin, placeOfSupply) {
  const supplierState = (supplierGstin || "").trim().slice(0, 2);
  const customerState = (customerGstin || "").trim().slice(0, 2);
  const posState = (placeOfSupply || "").trim().match(/^\d{2}/)?.[0] || "";

  let isIntraState = false;
  if (/^\d{2}$/.test(supplierState)) {
    if (/^\d{2}$/.test(customerState)) {
      isIntraState = supplierState === customerState;
    } else if (/^\d{2}$/.test(posState)) {
      isIntraState = supplierState === posState;
    }
  }

  let subtotal = 0;
  let taxTotal = 0;
  const rateBuckets = {};

  for (const item of items) {
    const line = item.quantity * item.unitPrice;
    const tax = line * (item.taxRate / 100);
    subtotal += line;
    taxTotal += tax;

    const rate = String(item.taxRate);
    if (!rateBuckets[rate]) {
      rateBuckets[rate] = { taxable: 0, tax: 0 };
    }
    rateBuckets[rate].taxable += line;
    rateBuckets[rate].tax += tax;
  }

  return {
    isIntraState,
    supplierState,
    customerState,
    placeOfSupplyState: posState,
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    cgst: round2(isIntraState ? taxTotal / 2 : 0),
    sgst: round2(isIntraState ? taxTotal / 2 : 0),
    igst: round2(isIntraState ? 0 : taxTotal),
    grandTotal: round2(subtotal + taxTotal),
    rateBuckets,
  };
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function amountInWords(amount) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function threeDigits(n) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h ? ones[h] + " Hundred" + (rest ? " " : "") : "") + (rest ? twoDigits(rest) : "");
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let result = "";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  if (crore) result += threeDigits(crore) + " Crore ";
  if (lakh) result += threeDigits(lakh) + " Lakh ";
  if (thousand) result += threeDigits(thousand) + " Thousand ";
  if (rest) result += threeDigits(rest);

  result = result.trim() + " Rupees";
  if (paise) result += " and " + twoDigits(paise) + " Paise";
  return result + " Only";
}

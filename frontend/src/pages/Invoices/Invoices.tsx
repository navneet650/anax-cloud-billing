import { useState } from "react";
import { settingsService } from "../../services/settingsService";
import jsPDF from "jspdf";
import { customerService } from "../../services/customerService";
import { invoiceService } from "../../services/invoiceService";
import type { Customer } from "../../types/customer";
import type { Invoice, InvoiceItem } from "../../types/invoice";
import type { Product } from "../../types/product";
import { productService } from "../../services/productService";

const currencies = [
  { code: "INR", symbol: "₹" },
  { code: "AED", symbol: "د.إ" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
];

type SmartInvoiceStatus =
  | "Draft"
  | "Sent"
  | "Pending"
  | "Due Today"
  | "Overdue"
  | "Paid";

const getSmartInvoiceStatus = (
  invoice: Invoice
): SmartInvoiceStatus => {
  // Paid invoices always remain paid
  if (invoice.status === "Paid") {
    return "Paid";
  }

  // Draft invoices remain drafts
  if (invoice.status === "Draft") {
    return "Draft";
  }

  // No due date
  if (!invoice.dueDate) {
    return invoice.status === "Sent"
      ? "Sent"
      : "Pending";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(
    `${invoice.dueDate}T00:00:00`
  );

  if (dueDate < today) {
    return "Overdue";
  }

  if (dueDate.getTime() === today.getTime()) {
    return "Due Today";
  }

  return "Pending";
};

export default function Invoices() {
  const [showCreate, setShowCreate] = useState(false);

const [editingInvoiceId, setEditingInvoiceId] =
  useState<number | null>(null);

const [searchTerm, setSearchTerm] = useState("");

const [statusFilter, setStatusFilter] = useState<
  "All" | SmartInvoiceStatus
>("All");

const [customers] = useState<Customer[]>(() =>
  customerService
    .getAll()
    .filter((customer) => customer.isActive)
);

const [products] = useState<Product[]>(() =>
  productService
    .getAll()
    .filter((product) => product.isActive)
);
const settings = settingsService.get();
  const [invoiceNumber, setInvoiceNumber] = useState(`${settings.invoicePrefix}1005`);

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [customer, setCustomer] = useState("");
  const selectedCustomer = customers.find(
  (item) => item.id === customer
);
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [paymentTerms, setPaymentTerms] = useState(
  String(settings.paymentTerms)
);
const [poNumber, setPoNumber] = useState("");
const [placeOfSupply, setPlaceOfSupply] = useState("");
const [invoiceDescription, setInvoiceDescription] = useState("");
const [notes, setNotes] = useState("");
  const calculateDueDate = (
  invoiceDateValue: string,
  paymentTermsValue: string
) => {
  if (!invoiceDateValue) {
    return "";
  }

  const date = new Date(invoiceDateValue);

  date.setDate(
    date.getDate() + Number(paymentTermsValue)
  );

  return date.toISOString().split("T")[0];
};

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: settings.defaultTaxRate,
    },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
  const savedInvoices = invoiceService.getAll();

  if (savedInvoices.length > 0) {
  const usedNumbers = new Set<string>();
  let nextNumber = 1001;

  const cleanedInvoices = savedInvoices.map((invoice) => {
    if (!usedNumbers.has(invoice.invoiceNumber)) {
      usedNumbers.add(invoice.invoiceNumber);

      const match = invoice.invoiceNumber.match(
        /INV-(\d+)/
      );

      if (match) {
        nextNumber = Math.max(
          nextNumber,
          Number(match[1]) + 1
        );
      }

      return invoice;
    }

    while (
      usedNumbers.has(`INV-${nextNumber}`)
    ) {
      nextNumber++;
    }

    const updatedInvoice = {
      ...invoice,
      invoiceNumber: `INV-${nextNumber}`,
    };

    usedNumbers.add(updatedInvoice.invoiceNumber);
    nextNumber++;

    return updatedInvoice;
  });

  invoiceService.saveAll(cleanedInvoices);

  return cleanedInvoices;
}

  const sampleInvoices: Invoice[] = [
    {
      id: 1,
      invoiceNumber: "INV-1001",
      customer: "ABC Technologies Pvt Ltd",
      date: "2026-08-01",
      dueDate: "2026-08-15",
      amount: 45000,
      currency: "INR",
      status: "Paid",
    },
    {
      id: 2,
      invoiceNumber: "INV-1002",
      customer: "XYZ Industries",
      date: "2026-08-03",
      dueDate: "2026-08-18",
      amount: 28500,
      currency: "INR",
      status: "Pending",
    },
    {
      id: 3,
      invoiceNumber: "INV-1003",
      customer: "ABC Technologies Pvt Ltd",
      date: "2026-08-05",
      dueDate: "2026-08-20",
      amount: 62000,
      currency: "INR",
      status: "Overdue",
    },
    {
      id: 4,
      invoiceNumber: "INV-1004",
      customer: "XYZ Industries",
      date: "2026-08-06",
      dueDate: "2026-08-21",
      amount: 18500,
      currency: "INR",
      status: "Draft",
    },
  ];

  invoiceService.saveAll(sampleInvoices);

  return sampleInvoices;
});

  const formatCurrency = (
  value: number,
  currencyCode = currency
) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
};

 const updateItem = (
  id: number,
  field: keyof InvoiceItem,
  value: string | number
) => {
  setItems((current) =>
    current.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: value,
          }
        : item
    )
  );
};

const selectProduct = (
  itemId: number,
  productId: string
) => {
  const selectedProduct = products.find(
    (product) => product.id === productId
  );

  if (!selectedProduct) {
    return;
  }

  if (selectedProduct.currency !== currency) {
    window.alert(
      `This product is priced in ${selectedProduct.currency}. ` +
      `Please select an invoice currency of ${selectedProduct.currency}.`
    );
    return;
  }

  setItems((current) =>
    current.map((item) =>
      item.id === itemId
        ? {
            ...item,
            productId: selectedProduct.id,
            description: selectedProduct.name,
            unitPrice: selectedProduct.unitPrice,
            taxRate: selectedProduct.taxRate,
          }
        : item
    )
  );
};

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) {
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const subtotal = items.reduce(
  (sum, item) =>
    sum + item.quantity * item.unitPrice,
  0
);

const supplierStateCode =
  settings.gstin.trim().slice(0, 2);

const customerStateCode =
  selectedCustomer?.gstin?.trim().slice(0, 2) || "";

const placeOfSupplyStateCode =
  placeOfSupply.trim().match(/^\d{2}/)?.[0] || "";

const isIntraState =
  /^\d{2}$/.test(supplierStateCode) &&
  (
    /^\d{2}$/.test(customerStateCode)
      ? supplierStateCode === customerStateCode
      : supplierStateCode === placeOfSupplyStateCode
  );

const taxTotal = items.reduce(
  (sum, item) =>
    sum +
    (item.quantity *
      item.unitPrice *
      item.taxRate) /
      100,
  0
);

const cgstTotal = isIntraState
  ? taxTotal / 2
  : 0;

const sgstTotal = isIntraState
  ? taxTotal / 2
  : 0;

const igstTotal = isIntraState
  ? 0
  : taxTotal;

const total = subtotal + taxTotal;

  const paidCount = invoices.filter(
    (invoice) => invoice.status === "Paid"
  ).length;

  const pendingCount = invoices.filter(
    (invoice) =>
      invoice.status === "Pending" ||
      invoice.status === "Sent"
  ).length;

  const outstandingByCurrency = invoices
  .filter(
    (invoice) =>
      invoice.status === "Pending" ||
      invoice.status === "Sent" ||
      invoice.status === "Overdue"
  )
  .reduce<Record<string, number>>((totals, invoice) => {
    totals[invoice.currency] =
      (totals[invoice.currency] || 0) + invoice.amount;

    return totals;
  }, {});

const outstanding = Object.entries(
  outstandingByCurrency
)
  .map(([currencyCode, amount]) =>
    formatCurrency(
  amount,
  currencyCode as Invoice["currency"]
)
  )
  .join(" • ");

  const resetInvoiceForm = () => {
  const highestInvoiceNumber = invoices.reduce(
    (highest, invoice) => {
      const match = invoice.invoiceNumber.match(
        /INV-(\d+)/
      );

      const number = match
        ? Number(match[1])
        : 1000;

      return Math.max(highest, number);
    },
    1000
  );

  setInvoiceNumber(
  `${settings.invoicePrefix}${highestInvoiceNumber + 1}`
);

    const newInvoiceDate = new Date().toISOString().split("T")[0];

setInvoiceDate(newInvoiceDate);
setDueDate(
  calculateDueDate(
    newInvoiceDate,
    String(settings.paymentTerms)
  )
);
setCurrency(settings.defaultCurrency);
setPaymentTerms(String(settings.paymentTerms));
    setCustomer("");
    setPoNumber("");
setPlaceOfSupply("");
setInvoiceDescription("");
setNotes("");

    setItems([
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: settings.defaultTaxRate,
      },
    ]);
  };

  const editInvoice = (invoice: Invoice) => {
  setEditingInvoiceId(invoice.id);

  setInvoiceNumber(invoice.invoiceNumber);
  setInvoiceDate(invoice.date);
  setDueDate(invoice.dueDate);
  setCurrency(invoice.currency);
  setPoNumber(invoice.poNumber ?? "");
setPlaceOfSupply(invoice.placeOfSupply ?? "");
setInvoiceDescription(invoice.invoiceDescription ?? "");
setNotes(invoice.notes ?? "");

  const matchingCustomer = customers.find(
    (item) => item.companyName === invoice.customer
  );

  setCustomer(
    matchingCustomer?.id ?? ""
  );

  setItems(
    invoice.items?.length
      ? invoice.items.map((item) => ({
          ...item,
        }))
      : [
          {
            id: Date.now(),
            description: "",
            quantity: 1,
            unitPrice: 0,
            taxRate: 18,
          },
        ]
  );

  setShowCreate(true);
}; 

const updateInvoiceStatus = (
  invoiceId: number,
  status: Invoice["status"]
) => {
  setInvoices((current) => {
    const updatedInvoices = current.map((invoice) =>
      invoice.id === invoiceId
        ? { ...invoice, status }
        : invoice
    );

    invoiceService.saveAll(updatedInvoices);

    return updatedInvoices;
  });
};

const downloadInvoicePdf = (invoice: Invoice) => {
  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 18;
  const rightMargin = pageWidth - margin;

  const currencySymbols: Record<string, string> = {
    INR: "Rs.",
    AED: "AED",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol =
    currencySymbols[invoice.currency] ||
    invoice.currency;

  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const drawLine = (y: number) => {
    pdf.setDrawColor(220, 224, 230);
    pdf.line(margin, y, rightMargin, y);
  };

    /* ---------- HEADER ---------- */

  const businessName =
    settings.businessName?.trim() || "Anax Enterprise";

  const legalName =
    settings.legalName?.trim() || "";

  const businessAddress = [
    settings.address,
    settings.city,
    settings.state,
    settings.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const businessContact = [
    settings.phone
      ? `Phone: ${settings.phone}`
      : "",
    settings.email
      ? `Email: ${settings.email}`
      : "",
    settings.website
      ? `Web: ${settings.website}`
      : "",
  ]
    .filter(Boolean)
    .join("  |  ");

  /* Header area */
  pdf.setDrawColor(220, 224, 230);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 12, rightMargin, 12);

  /* Business name */
  pdf.setTextColor(31, 41, 55);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(businessName, margin, 22);

  /* Legal name */
  if (legalName && legalName !== businessName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(legalName, margin, 28);
  }

  /* Address */
  let headerY = legalName && legalName !== businessName
    ? 34
    : 29;

  if (businessAddress) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const addressLines = pdf.splitTextToSize(
      businessAddress,
      105
    );
    pdf.text(addressLines, margin, headerY);
    headerY += addressLines.length * 4;
  }

  /* GSTIN */
  if (settings.gstin) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(
      `GSTIN: ${settings.gstin}`,
      margin,
      headerY + 4
    );
    headerY += 8;
  }

  /* Contact information */
  if (businessContact) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    const contactLines = pdf.splitTextToSize(
      businessContact,
      105
    );
    pdf.text(
      contactLines,
      margin,
      headerY + 1
    );
    headerY += contactLines.length * 4;
  }

  /* Invoice title on right */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(
    "TAX INVOICE",
    rightMargin,
    22,
    { align: "right" }
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    "Original for Recipient",
    rightMargin,
    29,
    { align: "right" }
  );

  /* Logo */
  if (settings.logo) {
    try {
      pdf.addImage(
        settings.logo,
        "AUTO",
        rightMargin - 38,
        34,
        38,
        22,
        undefined,
        "FAST"
      );
    } catch (error) {
      console.warn(
        "Unable to add invoice logo:",
        error
      );
    }
  }

  pdf.setTextColor(31, 41, 55);

  let y = Math.max(headerY + 10, 62);

   /* ---------- INVOICE DETAILS ---------- */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Invoice Details", margin, y);

  y += 8;

  const detailsLeftX = margin;
  const detailsRightX = 110;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  pdf.text(
    `Invoice Number: ${invoice.invoiceNumber}`,
    detailsLeftX,
    y
  );

  pdf.text(
    `Invoice Date: ${invoice.date}`,
    detailsRightX,
    y
  );

  y += 7;

  pdf.text(
    `Due Date: ${invoice.dueDate || "Due on receipt"}`,
    detailsLeftX,
    y
  );

  pdf.text(
    `Currency: ${invoice.currency}`,
    detailsRightX,
    y
  );

  y += 7;

  if (invoice.poNumber) {
    pdf.text(
      `PO Number: ${invoice.poNumber}`,
      detailsLeftX,
      y
    );
  }

  if (invoice.placeOfSupply) {
    pdf.text(
      `Place of Supply: ${invoice.placeOfSupply}`,
      detailsRightX,
      y
    );
  }

  y += 12;

  drawLine(y);

  y += 12;

    /* ---------- CUSTOMER ---------- */

  const selectedPdfCustomer = customers.find(
    (customer) =>
      customer.companyName === invoice.customer
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Bill To", margin, y);

  y += 6;

  /* Customer box */
  const customerBoxTop = y;
  const customerBoxWidth = pageWidth - margin * 2;

  let customerBoxHeight = 42;

  if (selectedPdfCustomer) {
    const addressParts = [
      selectedPdfCustomer.addressLine1,
      selectedPdfCustomer.addressLine2,
      selectedPdfCustomer.city,
      selectedPdfCustomer.state,
      selectedPdfCustomer.pincode,
      selectedPdfCustomer.country,
    ].filter(Boolean);

    const address = addressParts.join(", ");

    const addressLines = address
      ? pdf.splitTextToSize(address, 105)
      : [];

    customerBoxHeight = Math.max(
      42,
      24 + addressLines.length * 4
    );
  }

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(220, 224, 230);
  pdf.roundedRect(
    margin,
    customerBoxTop,
    customerBoxWidth,
    customerBoxHeight,
    2,
    2,
    "FD"
  );

  let customerY = customerBoxTop + 9;

  pdf.setTextColor(31, 41, 55);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(
    invoice.customer,
    margin + 5,
    customerY
  );

  customerY += 7;

  if (selectedPdfCustomer) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);

    /* Contact person */
    if (selectedPdfCustomer.contactPerson) {
      pdf.text(
        `Contact: ${selectedPdfCustomer.contactPerson}`,
        margin + 5,
        customerY
      );
      customerY += 5;
    }

    /* Address */
    const addressParts = [
      selectedPdfCustomer.addressLine1,
      selectedPdfCustomer.addressLine2,
      selectedPdfCustomer.city,
      selectedPdfCustomer.state,
      selectedPdfCustomer.pincode,
      selectedPdfCustomer.country,
    ].filter(Boolean);

    if (addressParts.length > 0) {
      const address = addressParts.join(", ");

      const addressLines = pdf.splitTextToSize(
        address,
        105
      );

      pdf.text(
        addressLines,
        margin + 5,
        customerY
      );

      customerY += addressLines.length * 4;
    }

    /* GSTIN */
    if (selectedPdfCustomer.gstin) {
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `GSTIN: ${selectedPdfCustomer.gstin}`,
        margin + 5,
        customerY + 1
      );
    }

    /* Contact details on right */
    let contactY = customerBoxTop + 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);

    if (selectedPdfCustomer.email) {
      pdf.text(
        `Email: ${selectedPdfCustomer.email}`,
        rightMargin - 5,
        contactY,
        { align: "right" }
      );
      contactY += 5;
    }

    if (selectedPdfCustomer.mobile) {
      pdf.text(
        `Mobile: ${selectedPdfCustomer.mobile}`,
        rightMargin - 5,
        contactY,
        { align: "right" }
      );
    }
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.text(
      "Customer details not available",
      margin + 5,
      customerY
    );
  }

  y = customerBoxTop + customerBoxHeight + 10;

  /* ---------- ITEMS TABLE ---------- */

  const tableTop = y;
  const descriptionX = margin + 2;
  const qtyX = 112;
  const priceX = 132;
  const taxX = 162;
  const amountX = rightMargin - 2;

  pdf.setFillColor(243, 244, 246);
  pdf.rect(
    margin,
    tableTop - 6,
    pageWidth - margin * 2,
    10,
    "F"
  );

  pdf.setTextColor(31, 41, 55);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text("Description", descriptionX, tableTop);
  pdf.text("Qty", qtyX, tableTop);
  pdf.text("Unit Price", priceX, tableTop);
  pdf.text("Tax", taxX, tableTop);
  pdf.text("Amount", amountX, tableTop, {
    align: "right",
  });

  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  const invoiceItems = invoice.items ?? [];

  let subtotal = 0;
  let taxTotal = 0;

  invoiceItems.forEach((item) => {
    const lineSubtotal =
      item.quantity * item.unitPrice;

    const lineTax =
      lineSubtotal * (item.taxRate / 100);

    const lineTotal =
      lineSubtotal + lineTax;

    subtotal += lineSubtotal;
    taxTotal += lineTax;

    if (y > pageHeight - 55) {
      pdf.addPage();
      y = 25;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);

      pdf.text(
        "Description",
        descriptionX,
        y
      );
      pdf.text("Qty", qtyX, y);
      pdf.text(
        "Unit Price",
        priceX,
        y
      );
      pdf.text("Tax", taxX, y);
      pdf.text(
        "Amount",
        amountX,
        y,
        { align: "right" }
      );

      y += 9;

      pdf.setFont("helvetica", "normal");
    }

        const descriptionLines = pdf.splitTextToSize(
      item.description,
      78
    );

    pdf.text(
      descriptionLines,
      descriptionX,
      y
    );

    pdf.text(
      String(item.quantity),
      qtyX,
      y
    );

    pdf.text(
      formatAmount(item.unitPrice),
      priceX,
      y
    );

    pdf.text(
      `${item.taxRate}%`,
      taxX,
      y
    );

    pdf.text(
      `${symbol} ${formatAmount(lineTotal)}`,
      amountX,
      y,
      { align: "right" }
    );

    const rowHeight = Math.max(
      8,
      descriptionLines.length * 5
    );

    y += rowHeight;

    drawLine(y - 3);
  });

    /* ---------- TOTALS ---------- */

  const supplierStateCode =
    settings.gstin.trim().slice(0, 2);

  const customerStateCode =
    selectedPdfCustomer?.gstin?.trim().slice(0, 2) || "";

  const placeOfSupplyStateCode =
    invoice.placeOfSupply?.trim().match(/^\d{2}/)?.[0] || "";

  const isIntraState =
    /^\d{2}$/.test(supplierStateCode) &&
    (
      /^\d{2}$/.test(customerStateCode)
        ? supplierStateCode === customerStateCode
        : supplierStateCode === placeOfSupplyStateCode
    );

  const cgstTotal = isIntraState
    ? taxTotal / 2
    : 0;

  const sgstTotal = isIntraState
    ? taxTotal / 2
    : 0;

  const igstTotal = isIntraState
    ? 0
    : taxTotal;

  y += 10;

  const totalsX = 130;
  const totalsValueX = rightMargin - 2;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(31, 41, 55);

  /* Subtotal */
  pdf.text(
    "Subtotal",
    totalsX,
    y
  );

  pdf.text(
    `${symbol} ${formatAmount(subtotal)}`,
    totalsValueX,
    y,
    { align: "right" }
  );

  y += 7;

  /* GST */
  if (isIntraState) {
    pdf.text(
      "CGST",
      totalsX,
      y
    );

    pdf.text(
      `${symbol} ${formatAmount(cgstTotal)}`,
      totalsValueX,
      y,
      { align: "right" }
    );

    y += 7;

    pdf.text(
      "SGST",
      totalsX,
      y
    );

    pdf.text(
      `${symbol} ${formatAmount(sgstTotal)}`,
      totalsValueX,
      y,
      { align: "right" }
    );
  } else {
    pdf.text(
      "IGST",
      totalsX,
      y
    );

    pdf.text(
      `${symbol} ${formatAmount(igstTotal)}`,
      totalsValueX,
      y,
      { align: "right" }
    );
  }

  y += 11;

  /* Grand Total */
  const grandTotalTop = y - 6;
  const grandTotalWidth =
    rightMargin - totalsX;

  pdf.setFillColor(31, 41, 55);

  pdf.roundedRect(
    totalsX,
    grandTotalTop,
    grandTotalWidth,
    16,
    2,
    2,
    "F"
  );

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  pdf.text(
    "Grand Total",
    totalsX + 5,
    y + 4
  );

  pdf.text(
    `${symbol} ${formatAmount(invoice.amount)}`,
    rightMargin - 5,
    y + 4,
    { align: "right" }
  );

  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  const footerY = pageHeight - 25;

  drawLine(footerY - 6);

  pdf.text(
    "Thank you for your business.",
    margin,
    footerY
  );

  pdf.text(
    "Generated by AnaxBill",
    rightMargin,
    footerY,
    { align: "right" }
  );

  pdf.save(
    `${invoice.invoiceNumber}.pdf`
  );
};
  const saveInvoice = () => {
    if (!customer) {
      window.alert("Please select a customer.");
      return;
    }

    if (!invoiceDate) {
  window.alert("Please select an invoice date.");
  return;
}
if (
  invoices.some(
    (invoice) =>
      invoice.invoiceNumber.trim().toLowerCase() ===
        invoiceNumber.trim().toLowerCase() &&
      invoice.id !== editingInvoiceId
  )
) {
  window.alert(
    "An invoice with this invoice number already exists."
  );
  return;
}
    if (
  items.some(
    (item) =>
      !item.description.trim() ||
      item.quantity <= 0 ||
      item.unitPrice <= 0
  )
) {
  window.alert(
    "Please enter a description, valid quantity, and unit price for every item."
  );
  return;
}

    if (total <= 0) {
      window.alert(
        "Please enter a valid amount for the invoice."
      );
      return;
    }
const selectedCustomer = customers.find(
  (item) => item.id === customer
);

if (!selectedCustomer) {
  window.alert("Selected customer could not be found.");
  return;
}
    const invoiceData: Invoice = {
  id: editingInvoiceId ?? Date.now(),
  invoiceNumber,
  customer: selectedCustomer.companyName,
        date: invoiceDate,
      dueDate,
      poNumber,
      placeOfSupply,
      invoiceDescription,
      notes,
      amount: total,
  currency: currency as
    | "INR"
    | "AED"
    | "USD"
    | "EUR"
    | "GBP",
    items: [...items],
  status: editingInvoiceId
    ? invoices.find(
        (invoice) =>
          invoice.id === editingInvoiceId
      )?.status ?? "Draft"
    : "Draft",
};

setInvoices((current) => {
  const updatedInvoices = editingInvoiceId
    ? current.map((invoice) =>
        invoice.id === editingInvoiceId
          ? invoiceData
          : invoice
      )
    : [...current, invoiceData];

  invoiceService.saveAll(updatedInvoices);

  return updatedInvoices;
});

setEditingInvoiceId(null);
setShowCreate(false);
resetInvoiceForm();
  };
const filteredInvoices = invoices.filter((invoice) => {
  const matchesSearch =
    invoice.invoiceNumber
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    invoice.customer
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

  const smartStatus =
  getSmartInvoiceStatus(invoice);

const matchesStatus =
  statusFilter === "All" ||
  smartStatus === statusFilter;

  return matchesSearch && matchesStatus;
});
  return (
    <div style={styles.page}>
      {/* PAGE HEADER */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Invoices</h1>

          <p style={styles.pageSubtitle}>
            Create, manage and track customer invoices
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
  resetInvoiceForm();
  setEditingInvoiceId(null);
  setShowCreate(true);
}}
          style={styles.primaryButton}
        >
          <span style={{ fontSize: 20 }}>+</span>
          Create Invoice
        </button>
      </div>

      {/* SUMMARY */}
      <div style={styles.summaryGrid}>
        <SummaryCard
  title="Total Invoices"
  value={String(invoices.length)}
  icon="📄"
  accent="#2563eb"
  background="#f5f9ff"
/>

<SummaryCard
  title="Paid"
  value={String(paidCount)}
  icon="✓"
  accent="#059669"
  background="#f2fbf7"
/>

<SummaryCard
  title="Pending"
  value={String(pendingCount)}
  icon="◷"
  accent="#d97706"
  background="#fffbeb"
/>

<SummaryCard
  title="Outstanding"
  value={outstanding || "—"}
  icon="₹"
  accent="#7c3aed"
  background="#faf7ff"
/>
      </div>

      {/* INVOICE LIST */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Invoice List
            </h2>

            <p style={styles.cardSubtitle}>
              Manage invoices and payment status
            </p>
                    </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                minWidth: "230px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "All" | Invoice["status"]
                )
              }
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            >
              <option value="All">All Status</option>
<option value="Draft">Draft</option>
<option value="Sent">Sent</option>
<option value="Pending">Pending</option>
<option value="Due Today">Due Today</option>
<option value="Overdue">Overdue</option>
<option value="Paid">Paid</option>
            </select>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
  resetInvoiceForm();
  setEditingInvoiceId(null);
  setShowCreate(true);
}}
          >
            + New Invoice
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Invoice Date</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
             {filteredInvoices.length === 0 ? (
  <tr>
    <td
      colSpan={7}
      style={{
        ...styles.td,
        textAlign: "center",
        padding: "30px",
        color: "#6b7280",
      }}
    >
      No invoices found. Try changing your search or filter criteria.
    </td>
  </tr>
) : (
  filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={styles.td}>
                    <strong>
                      {invoice.invoiceNumber}
                    </strong>
                  </td>

                  <td style={styles.td}>
                    {invoice.customer}
                  </td>

                  <td style={styles.td}>
                    {invoice.date}
                  </td>

                  <td style={styles.td}>
                    {invoice.dueDate || "—"}
                  </td>

                  <td style={styles.td}>
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </td>

                 <td style={styles.td}>
  {(() => {
    const smartStatus = getSmartInvoiceStatus(invoice);

    return (
      <select
        value={invoice.status === "Paid" ? "Paid" : smartStatus}
        onChange={(e) =>
          updateInvoiceStatus(
            invoice.id,
            e.target.value as Invoice["status"]
          )
        }
        style={{
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        {invoice.status === "Paid" ? (
          <>
            <option value="Paid">Paid</option>
            <option value="Sent">Sent</option>
          </>
        ) : smartStatus === "Overdue" ? (
          <>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
            <option value="Sent">Sent</option>
            <option value="Draft">Draft</option>
          </>
        ) : (
          <>
            <option value={smartStatus}>{smartStatus}</option>
            <option value="Paid">Paid</option>
            <option value="Sent">Sent</option>
            <option value="Draft">Draft</option>
          </>
        )}
      </select>
    );
  })()}
</td>

                  <td style={styles.td}>
                    {invoice.status === "Draft" && (
  <button
    type="button"
    onClick={() =>
      updateInvoiceStatus(invoice.id, "Sent")
    }
    style={{
      border: "none",
      background: "transparent",
      color: "#7c3aed",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Send
  </button>
)}
  <button
    type="button"
    onClick={() => editInvoice(invoice)}
    style={{
      border: "none",
      background: "transparent",
      color: "#2563eb",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() => downloadInvoicePdf(invoice)}
    style={{
      border: "none",
      background: "transparent",
      color: "#059669",
      cursor: "pointer",
      fontWeight: 600,
      marginLeft: "12px",
    }}
  >
    PDF
  </button>
  <button
  type="button"
  onClick={() => {
    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`
    );

    if (!confirmed) {
      return;
    }

    const updatedInvoices = invoices.filter(
      (item) => item.id !== invoice.id
    );

    setInvoices(updatedInvoices);
    invoiceService.saveAll(updatedInvoices);
  }}
  style={{
    border: "none",
    background: "transparent",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 600,
    marginLeft: "12px",
  }}
>
  Delete
</button>
</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreate && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
  {editingInvoiceId
    ? "Edit Invoice"
    : "Create Invoice"}
</h2>

<p style={styles.modalSubtitle}>
  {editingInvoiceId
    ? "Update the invoice details and line items"
    : "Create a new invoice for your customer"}
</p>

                <p style={styles.modalSubtitle}>
                  Create a new invoice for your customer
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* INVOICE DETAILS */}
              <SectionTitle title="Invoice Details" />

              <div style={styles.formGrid}>
                <FormField label="Invoice Number">
  <input
    value={invoiceNumber}
    onChange={(e) =>
      setInvoiceNumber(e.target.value)
    }
    style={styles.input}
  />
</FormField>

                <FormField label="Invoice Date">
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => {
  const newDate = e.target.value;

  setInvoiceDate(newDate);

  setDueDate(
    calculateDueDate(newDate, paymentTerms)
  );
}}
                    style={styles.input}
                  />
                </FormField>

                <FormField label="Due Date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) =>
                      setDueDate(e.target.value)
                    }
                    style={styles.input}
                  />
                </FormField>
              </div>
                            <div style={styles.formGrid}>
                <FormField label="PO Number">
                  <input
                    value={poNumber}
                    onChange={(e) =>
                      setPoNumber(e.target.value)
                    }
                    style={styles.input}
                    placeholder="Purchase order number"
                  />
                </FormField>

                <FormField label="Place of Supply">
                  <input
                    value={placeOfSupply}
                    onChange={(e) =>
                      setPlaceOfSupply(e.target.value)
                    }
                    style={styles.input}
                    placeholder="e.g. 08 - Rajasthan"
                  />
                </FormField>
              </div>
                            <div style={styles.formGrid}>
                <FormField label="Invoice Description">
                  <textarea
                    value={invoiceDescription}
                    onChange={(e) =>
                      setInvoiceDescription(e.target.value)
                    }
                    style={{
                      ...styles.input,
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                    placeholder="Description or reference for this invoice"
                  />
                </FormField>

                <FormField label="Notes / Terms & Conditions">
                  <textarea
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                    style={{
                      ...styles.input,
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                    placeholder="Payment notes, terms & conditions, or other information"
                  />
                </FormField>
              </div>

              {/* CUSTOMER */}
              <SectionTitle title="Customer" />

              <div style={styles.formGrid}>
                <FormField label="Customer">
                  <select
                    value={customer}
                    onChange={(e) => {
  const customerId = e.target.value;

  setCustomer(customerId);

  const selected = customers.find(
    (item) => item.id === customerId
  );

  if (selected) {
    const terms = String(
      selected.paymentTerms
    );

    setPaymentTerms(terms);

    setDueDate(
      calculateDueDate(
        invoiceDate,
        terms
      )
    );
  }
}}
                    style={styles.input}
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map((customer) => (
  <option
    key={customer.id}
    value={customer.id}
  >
    {customer.companyName}
  </option>
))}
                  </select>
                </FormField>
                {selectedCustomer && (
  <div
    style={{
      gridColumn: "1 / -1",
      padding: "16px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      background: "#f9fafb",
    }}
  >
    <strong>{selectedCustomer.companyName}</strong>

    <div style={{ marginTop: "8px", color: "#6b7280" }}>
      {selectedCustomer.contactPerson}
      {selectedCustomer.email
        ? ` • ${selectedCustomer.email}`
        : ""}
      {selectedCustomer.mobile
        ? ` • ${selectedCustomer.mobile}`
        : ""}
    </div>

    <div style={{ marginTop: "6px", color: "#6b7280" }}>
      {selectedCustomer.addressLine1}
      {selectedCustomer.addressLine2
        ? `, ${selectedCustomer.addressLine2}`
        : ""}
      {selectedCustomer.city
        ? `, ${selectedCustomer.city}`
        : ""}
      {selectedCustomer.state
        ? `, ${selectedCustomer.state}`
        : ""}
      {selectedCustomer.pincode
        ? ` - ${selectedCustomer.pincode}`
        : ""}
      {selectedCustomer.country
        ? `, ${selectedCustomer.country}`
        : ""}
    </div>

    {selectedCustomer.gstin && (
      <div style={{ marginTop: "6px" }}>
        <strong>GSTIN:</strong>{" "}
        {selectedCustomer.gstin}
      </div>
    )}
  </div>
)}


                <FormField label="Currency">
                  <select
                    value={currency}
                    onChange={(e) => {
  const newCurrency = e.target.value;

  setCurrency(newCurrency as Invoice["currency"]);

  setItems((current) =>
    current.map((item) => ({
      ...item,
      productId: undefined,
      unitPrice: 0,
      taxRate: 18,
    }))
  );
}}
                    style={styles.input}
                  >
                    {currencies.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                      >
                        {item.code} ({item.symbol})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Payment Terms">
                  <select
                    value={paymentTerms}
                    onChange={(e) => {
  const newTerms = e.target.value;

  setPaymentTerms(newTerms);

  setDueDate(
    calculateDueDate(invoiceDate, newTerms)
  );
}}
                    style={styles.input}
                  >
                    <option value="0">
                      Due on receipt
                    </option>

                    <option value="7">
                      Net 7
                    </option>

                    <option value="15">
                      Net 15
                    </option>

                    <option value="30">
                      Net 30
                    </option>

                    <option value="45">
                      Net 45
                    </option>

                    <option value="60">
                      Net 60
                    </option>
                  </select>
                </FormField>
              </div>

              {/* ITEMS */}
              <div style={styles.itemsHeader}>
                <div>
                  <SectionTitle
                    title="Items & Services"
                  />

                  <p style={styles.helperText}>
                    Add the products or services
                    being billed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  style={styles.secondaryButton}
                >
                  + Add Item
                </button>
              </div>

              <div style={styles.itemTableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Description
                      </th>

                      <th style={styles.thSmall}>
                        Qty
                      </th>

                      <th style={styles.thSmall}>
                        Unit Price
                      </th>

                      <th style={styles.thSmall}>
                        Tax %
                      </th>

                      <th style={styles.thSmall}>
                        Amount
                      </th>

                      <th style={styles.thSmall}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => {
                      const amount =
                        item.quantity *
                        item.unitPrice;

                      return (
                        <tr key={item.id}>
                          <td style={styles.td}>
                            <select
  value={item.productId || ""}
  onChange={(e) => {
    if (e.target.value) {
      selectProduct(
        item.id,
        e.target.value
      );
    } else {
      updateItem(
        item.id,
        "productId",
        ""
      );
    }
  }}
  style={styles.tableInput}
>
  <option value="">
    Select product/service
  </option>

  {products
  .filter(
    (product) => product.currency === currency
  )
  .map((product) => (
    <option
      key={product.id}
      value={product.id}
    >
      {product.name} — {product.currency}{" "}
      {product.unitPrice.toLocaleString()} /{" "}
      {product.unit}
    </option>
  ))}
</select>
                          </td>

                          <td style={styles.td}>
                            <input
                              type="number"
                              min="0"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              style={
                                styles.numberInput
                              }
                            />
                          </td>

                          <td style={styles.td}>
                            <input
  type="number"
  min="0"
  value={item.unitPrice === 0 ? "" : item.unitPrice}
  placeholder="0"
  onChange={(e) =>
    updateItem(
      item.id,
      "unitPrice",
      e.target.value === "" ? 0 : Number(e.target.value)
    )
  }
  style={styles.numberInput}
/>
                          </td>

                          <td style={styles.td}>
                            <select
                              value={
                                item.taxRate
                              }
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "taxRate",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              style={
                                styles.numberInput
                              }
                            >
                              <option value={0}>
                                0%
                              </option>
                              <option value={5}>
                                5%
                              </option>
                              <option value={10}>
                                10%
                              </option>
                              <option value={12}>
                                12%
                              </option>
                              <option value={15}>
                                15%
                              </option>
                              <option value={18}>
                                18%
                              </option>
                              <option value={20}>
                                20%
                              </option>
                              <option value={28}>
                                28%
                              </option>
                            </select>
                          </td>

                          <td
                            style={{
                              ...styles.td,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatCurrency(
                              amount
                            )}
                          </td>

                          <td style={styles.td}>
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              style={
                                styles.removeButton
                              }
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div style={styles.totalsArea}>
                <div style={styles.totalsBox}>
                  {isIntraState ? (
  <>
    <div style={styles.totalRow}>
      <span>CGST</span>
      <strong>
        {formatCurrency(cgstTotal)}
      </strong>
    </div>

    <div style={styles.totalRow}>
      <span>SGST</span>
      <strong>
        {formatCurrency(sgstTotal)}
      </strong>
    </div>
  </>
) : (
  <div style={styles.totalRow}>
    <span>IGST</span>
    <strong>
      {formatCurrency(igstTotal)}
    </strong>
  </div>
)}

                  <div
                    style={{
                      ...styles.totalRow,
                      borderTop:
                        "2px solid #e5e7eb",
                      marginTop: 8,
                      paddingTop: 16,
                      fontSize: 18,
                    }}
                  >
                    <strong>
                      Grand Total
                    </strong>

                    <strong>
                      {formatCurrency(total)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
  type="button"
  onClick={saveInvoice}
  style={styles.primaryButton}
>
  {editingInvoiceId ? "Update Invoice" : "Save Draft"}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function SummaryCard({
  title,
  value,
  icon,
  accent,
  background,
}: {
  title: string;
  value: string;
  icon: string;
  accent: string;
  background: string;
}) {
  return (
    <div
      style={{
        ...styles.summaryCard,
        background,
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={styles.summaryTitle}>
          {title}
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          ...styles.summaryValue,
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h3 style={styles.sectionTitle}>
      {title}
    </h3>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.formField}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

/* ---------- STYLES ---------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 32,
    background:
      "linear-gradient(135deg, #f3f8ff 0%, #f8fbff 45%, #f4f7fb 100%)",
    minHeight: "100%",
    boxSizing: "border-box",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    gap: 20,
  },

  pageTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: "#0f3d6e",
    letterSpacing: "-0.5px",
  },

  pageSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },

    primaryButton: {
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    background:
      "linear-gradient(135deg, #0f5fa8 0%, #1677c8 100%)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: "0 6px 16px rgba(22, 119, 200, 0.22)",
  },

    secondaryButton: {
    border: "1px solid #b9d7ef",
    borderRadius: 9,
    padding: "9px 15px",
    background: "#f4f9fd",
    color: "#0f5fa8",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  cancelButton: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "11px 20px",
    background: "#ffffff",
    color: "#374151",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },

    summaryCard: {
    background:
      "linear-gradient(145deg, #ffffff 0%, #f7fbff 100%)",
    border: "1px solid #d9e8f5",
    borderRadius: 14,
    padding: 22,
    boxShadow:
      "0 8px 24px rgba(15, 61, 110, 0.07)",
  },

  summaryTitle: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
  },

    summaryValue: {
    color: "#0f5fa8",
    fontSize: 26,
    fontWeight: 750,
  },

    card: {
    background: "#ffffff",
    border: "1px solid #dbe9f4",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow:
      "0 10px 30px rgba(15, 61, 110, 0.07)",
  },

    cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #dbe9f4",
    background:
      "linear-gradient(90deg, #f8fbff 0%, #ffffff 100%)",
  },

    cardTitle: {
    margin: 0,
    fontSize: 19,
    fontWeight: 700,
    color: "#123a63",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    fontSize: 13,
    color: "#6b7280",
  },

  tableContainer: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 850,
  },

    th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 700,
    color: "#315a7d",
    background: "#eef6fc",
    borderBottom: "1px solid #d9e8f5",
    whiteSpace: "nowrap",
  },

  thSmall: {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 700,
    color: "#4b5563",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

    td: {
    padding: "15px 16px",
    fontSize: 14,
    color: "#374151",
    borderBottom: "1px solid #edf3f8",
    verticalAlign: "middle",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: 1100,
    maxHeight: "92vh",
    background: "#ffffff",
    borderRadius: 14,
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px",
    borderBottom: "1px solid #e5e7eb",
  },

  modalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#6b7280",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: 30,
    color: "#6b7280",
    cursor: "pointer",
    lineHeight: 1,
  },

  modalBody: {
    padding: 28,
    overflowY: "auto",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "16px 28px",
    borderTop: "1px solid #e5e7eb",
  },

  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 30,
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    outline: "none",
  },

  itemsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 12,
  },

  helperText: {
    margin: "-10px 0 16px",
    color: "#6b7280",
    fontSize: 13,
  },

  itemTableWrapper: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflowX: "auto",
    marginBottom: 24,
  },

  tableInput: {
    width: "100%",
    minWidth: 200,
    boxSizing: "border-box",
    padding: "9px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
  },

  numberInput: {
    width: 100,
    boxSizing: "border-box",
    padding: "9px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
  },

  removeButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  totalsArea: {
    display: "flex",
    justifyContent: "flex-end",
  },

  totalsBox: {
    width: 330,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 18,
    background: "#f9fafb",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    color: "#374151",
  },
};
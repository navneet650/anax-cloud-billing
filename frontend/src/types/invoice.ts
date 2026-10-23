export type InvoiceItem = {
  id: number;
  productId?: string | null;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  poNumber?: string;
  placeOfSupply?: string;
  invoiceDescription?: string;
  notes?: string;
  amount: number;
  currency: "INR" | "AED" | "USD" | "EUR" | "GBP";
  status: "Draft" | "Sent" | "Paid" | "Pending" | "Overdue" | "Cancelled";
  items?: InvoiceItem[];
};

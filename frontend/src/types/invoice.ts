export type InvoiceItem = {
  id: number;
  productId?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type Invoice = {
  id: number;
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
  status: "Draft" | "Sent" | "Paid" | "Pending" | "Overdue";
  items?: InvoiceItem[];
};




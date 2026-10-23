import { api } from "./api/client";
import type { Invoice, InvoiceItem } from "../types/invoice";

type ApiInvoice = {
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  customerGstin?: string;
  customerEmail?: string;
  date: string;
  dueDate?: string;
  poNumber?: string;
  placeOfSupply?: string;
  invoiceDescription?: string;
  notes?: string;
  currency: "INR" | "AED" | "USD" | "EUR" | "GBP";
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  isIntraState: boolean;
  grandTotal: number;
  status: Invoice["status"];
  createdAt: string;
  updatedAt: string;
};

type ListResponse = { items: ApiInvoice[]; count: number };

function fromApi(raw: ApiInvoice): Invoice {
  return {
    id: raw.invoiceId,
    invoiceNumber: raw.invoiceNumber,
    customer: raw.customerName,
    date: raw.date,
    dueDate: raw.dueDate || "",
    poNumber: raw.poNumber || "",
    placeOfSupply: raw.placeOfSupply || "",
    invoiceDescription: raw.invoiceDescription || "",
    notes: raw.notes || "",
    amount: raw.grandTotal,
    currency: raw.currency,
    status: raw.status,
    items: raw.items || [],
  };
}

function toApi(i: Partial<Invoice> & {
  customerId?: string | null;
  customerGstin?: string;
  customerEmail?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (i.customer !== undefined) out.customerName = i.customer;
  if (i.date !== undefined) out.date = i.date;
  if (i.dueDate !== undefined) out.dueDate = i.dueDate;
  if (i.poNumber !== undefined) out.poNumber = i.poNumber;
  if (i.placeOfSupply !== undefined) out.placeOfSupply = i.placeOfSupply;
  if (i.invoiceDescription !== undefined) out.invoiceDescription = i.invoiceDescription;
  if (i.notes !== undefined) out.notes = i.notes;
  if (i.currency !== undefined) out.currency = i.currency;
  if (i.items !== undefined) out.items = i.items;
  if (i.customerId !== undefined) out.customerId = i.customerId;
  if (i.customerGstin !== undefined) out.customerGstin = i.customerGstin;
  if (i.customerEmail !== undefined) out.customerEmail = i.customerEmail;
  if (i.status !== undefined) out.status = i.status;
  return out;
}

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const res = await api.get<ListResponse>("/invoices");
    return (res.items || []).map(fromApi);
  },

  async add(invoice: Partial<Invoice> & {
    customerId?: string | null;
    customerGstin?: string;
    customerEmail?: string;
  }): Promise<Invoice> {
    const res = await api.post<ApiInvoice>("/invoices", toApi(invoice));
    return fromApi(res);
  },

  async update(id: string, invoice: Partial<Invoice> & {
    customerId?: string | null;
    customerGstin?: string;
    customerEmail?: string;
  }): Promise<Invoice> {
    const res = await api.put<ApiInvoice>(
      `/invoices/${encodeURIComponent(id)}`,
      toApi(invoice)
    );
    return fromApi(res);
  },

  async updateStatus(id: string, status: Invoice["status"]): Promise<Invoice> {
    const res = await api.put<ApiInvoice>(
      `/invoices/${encodeURIComponent(id)}/status`,
      { status }
    );
    return fromApi(res);
  },

  async delete(id: string): Promise<void> {
    await api.del<{ deleted: boolean }>(
      `/invoices/${encodeURIComponent(id)}`
    );
  },

  async getPdf(id: string): Promise<{ url: string; sizeBytes: number }> {
    const res = await api.post<{ url: string; sizeBytes: number }>(
      `/invoices/${encodeURIComponent(id)}/pdf`
    );
    return res;
  },

  async send(id: string, to?: string): Promise<{ sent: boolean; to: string }> {
    const res = await api.post<{ sent: boolean; to: string }>(
      `/invoices/${encodeURIComponent(id)}/send`,
      to ? { to } : {}
    );
    return res;
  },
};

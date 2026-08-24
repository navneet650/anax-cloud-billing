import type { Invoice } from "../types/invoice";

const STORAGE_KEY = "invoices";

export const invoiceService = {
  getAll(): Invoice[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAll(invoices: Invoice[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  },

  add(invoice: Invoice) {
    const invoices = this.getAll();
    invoices.push(invoice);
    this.saveAll(invoices);
  },

  update(invoice: Invoice) {
    const invoices = this.getAll().map((item) =>
      item.id === invoice.id ? invoice : item
    );

    this.saveAll(invoices);
  },

  delete(id: number) {
    const invoices = this.getAll().filter(
      (invoice) => invoice.id !== id
    );

    this.saveAll(invoices);
  },
};

import type { Customer } from "../types/customer";

const STORAGE_KEY = "customers";

export const customerService = {
  getAll(): Customer[] {
    const data = localStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];
  },

  saveAll(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  },

  add(customer: Customer) {
    const customers = this.getAll();

    customers.push(customer);

    this.saveAll(customers);
  },

  update(customer: Customer) {
    const customers = this.getAll().map((c) =>
      c.id === customer.id ? customer : c
    );

    this.saveAll(customers);
  },

  delete(id: string) {
    const customers = this.getAll().filter((c) => c.id !== id);

    this.saveAll(customers);
  },
};
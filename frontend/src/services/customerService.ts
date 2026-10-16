import { api } from "./api/client";
import type { Customer } from "../types/customer";

type ApiCustomer = Omit<Customer, "id"> & {
  companyId: string;
  customerId: string;
};

type ListResponse = {
  items: ApiCustomer[];
  count: number;
};

function fromApi(raw: ApiCustomer): Customer {
  const { customerId, companyId, ...rest } = raw;
  void companyId;
  return {
    id: customerId,
    companyName: rest.companyName ?? "",
    contactPerson: rest.contactPerson ?? "",
    gstin: rest.gstin ?? "",
    pan: rest.pan ?? "",
    email: rest.email ?? "",
    mobile: rest.mobile ?? "",
    addressLine1: rest.addressLine1 ?? "",
    addressLine2: rest.addressLine2 ?? "",
    city: rest.city ?? "",
    state: rest.state ?? "",
    pincode: rest.pincode ?? "",
    country: rest.country ?? "India",
    customerType: rest.customerType ?? "Business",
    paymentTerms: rest.paymentTerms ?? 30,
    creditLimit: rest.creditLimit ?? 0,
    gstRegistered: rest.gstRegistered ?? false,
    isActive: rest.isActive ?? true,
    notes: rest.notes ?? "",
    createdAt: rest.createdAt ?? "",
    updatedAt: rest.updatedAt ?? "",
  };
}

function toApi(c: Partial<Customer>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.companyName !== undefined) out.companyName = c.companyName;
  if (c.contactPerson !== undefined) out.contactPerson = c.contactPerson;
  if (c.gstin !== undefined) out.gstin = c.gstin;
  if (c.pan !== undefined) out.pan = c.pan;
  if (c.email !== undefined) out.email = c.email;
  if (c.mobile !== undefined) out.mobile = c.mobile;
  if (c.addressLine1 !== undefined) out.addressLine1 = c.addressLine1;
  if (c.addressLine2 !== undefined) out.addressLine2 = c.addressLine2;
  if (c.city !== undefined) out.city = c.city;
  if (c.state !== undefined) out.state = c.state;
  if (c.pincode !== undefined) out.pincode = c.pincode;
  if (c.country !== undefined) out.country = c.country;
  if (c.customerType !== undefined) out.customerType = c.customerType;
  if (c.paymentTerms !== undefined) out.paymentTerms = c.paymentTerms;
  if (c.creditLimit !== undefined) out.creditLimit = c.creditLimit;
  if (c.gstRegistered !== undefined) out.gstRegistered = c.gstRegistered;
  if (c.isActive !== undefined) out.isActive = c.isActive;
  if (c.notes !== undefined) out.notes = c.notes;
  return out;
}

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const res = await api.get<ListResponse>("/customers");
    return (res.items || []).map(fromApi);
  },

  async add(customer: Customer): Promise<Customer> {
    const res = await api.post<ApiCustomer>("/customers", toApi(customer));
    return fromApi(res);
  },

  async update(customer: Customer): Promise<Customer> {
    const res = await api.put<ApiCustomer>(
      `/customers/${encodeURIComponent(customer.id)}`,
      toApi(customer)
    );
    return fromApi(res);
  },

  async delete(id: string): Promise<void> {
    await api.del<{ deleted: boolean }>(
      `/customers/${encodeURIComponent(id)}`
    );
  },
};

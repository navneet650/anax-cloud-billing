export interface Customer {
  id: string;

  companyName: string;
  contactPerson: string;

  gstin: string;
  pan: string;

  email: string;
  mobile: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  pincode: string;
  country: string;

  customerType: "Business" | "Individual";

  paymentTerms: number;

  creditLimit: number;

  gstRegistered: boolean;

  isActive: boolean;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}
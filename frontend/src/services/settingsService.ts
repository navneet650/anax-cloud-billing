import { api } from "./api/client";

export type BusinessSettings = {
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  bankName: string;
  bankBranch: string;
  accountNumber: string;
  ifsc: string;
  logo: string;

  defaultCurrency: "INR" | "AED" | "USD" | "EUR" | "GBP";
  paymentTerms: number;
  defaultTaxRate: number;
  invoicePrefix: string;
  termsAndConditions: string;
};

type SettingsApiResponse = Partial<BusinessSettings> & {
  companyId?: string;
  logoUrl?: string;
};

const defaultSettings: BusinessSettings = {
  businessName: "",
  legalName: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  website: "",
  address: "",
  city: "",
  state: "",
  pincode: "",

  bankName: "",
  bankBranch: "",
  accountNumber: "",
  ifsc: "",
  logo: "",

  defaultCurrency: "INR",
  paymentTerms: 30,
  defaultTaxRate: 18,
  invoicePrefix: "INV-",
  termsAndConditions: "",
};

function fromApi(raw: SettingsApiResponse | null): BusinessSettings {
  if (!raw) return defaultSettings;
  return {
    businessName: raw.businessName ?? "",
    legalName: raw.legalName ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    gstin: raw.gstin ?? "",
    pan: raw.pan ?? "",
    website: raw.website ?? "",
    address: raw.address ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    pincode: raw.pincode ?? "",
    bankName: raw.bankName ?? "",
    bankBranch: raw.bankBranch ?? "",
    accountNumber: raw.accountNumber ?? "",
    ifsc: raw.ifsc ?? "",
    logo: raw.logoUrl ?? raw.logo ?? "",
    defaultCurrency: (raw.defaultCurrency as BusinessSettings["defaultCurrency"]) ?? "INR",
    paymentTerms: raw.paymentTerms ?? 30,
    defaultTaxRate: raw.defaultTaxRate ?? 18,
    invoicePrefix: raw.invoicePrefix ?? "INV-",
    termsAndConditions: raw.termsAndConditions ?? "",
  };
}

function toApi(s: BusinessSettings): SettingsApiResponse {
  return {
    businessName: s.businessName,
    legalName: s.legalName,
    email: s.email,
    phone: s.phone,
    gstin: s.gstin,
    pan: s.pan,
    website: s.website,
    address: s.address,
    city: s.city,
    state: s.state,
    pincode: s.pincode,
    bankName: s.bankName,
    bankBranch: s.bankBranch,
    accountNumber: s.accountNumber,
    ifsc: s.ifsc,
    logoUrl: s.logo,
    defaultCurrency: s.defaultCurrency,
    paymentTerms: s.paymentTerms,
    defaultTaxRate: s.defaultTaxRate,
    invoicePrefix: s.invoicePrefix,
    termsAndConditions: s.termsAndConditions,
  };
}

export const settingsService = {
  async get(): Promise<BusinessSettings> {
    const raw = await api.get<SettingsApiResponse>("/settings");
    return fromApi(raw);
  },

  async save(settings: BusinessSettings): Promise<BusinessSettings> {
    const raw = await api.put<SettingsApiResponse>("/settings", toApi(settings));
    return fromApi(raw);
  },

  async reset(): Promise<BusinessSettings> {
    const empty = { ...defaultSettings };
    const raw = await api.put<SettingsApiResponse>("/settings", toApi(empty));
    return fromApi(raw);
  },
};

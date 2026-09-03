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
  defaultCurrency: "INR" | "AED" | "USD" | "EUR" | "GBP";
  paymentTerms: number;
  defaultTaxRate: number;
  invoicePrefix: string;
};

const STORAGE_KEY = "anax_cloud_billing_settings";

const defaultSettings: BusinessSettings = {
  businessName: "Anax Enterprise",
  legalName: "Anax Enterprise",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  website: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  defaultCurrency: "INR",
  paymentTerms: 30,
  defaultTaxRate: 18,
  invoicePrefix: "INV-",
};

export const settingsService = {
  get(): BusinessSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return defaultSettings;
      }

      return {
        ...defaultSettings,
        ...JSON.parse(saved),
      };
    } catch {
      return defaultSettings;
    }
  },

  save(settings: BusinessSettings): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  },

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
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

  bankName: "",
  bankBranch: "",
  accountNumber: "",
  ifsc: "",
  logo: "",

  defaultCurrency: "INR",
  paymentTerms: 30,
  defaultTaxRate: 18,
  invoicePrefix: "INV-",
  termsAndConditions:
  "1. Payment is due within the agreed credit period.\n" +
  "2. Please make the payment to the above bank account.\n" +
  "3. Any disputes are subject to Jaipur, Rajasthan jurisdiction only.\n" +
  "4. This is a computer generated invoice and does not require a signature.\n" +
  "5. For any queries, please contact us at navneet.bishnoi@gmail.com.",
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
export type Product = {
  id: string;

  name: string;
  sku: string;
  description: string;

  type: "Product" | "Service";
  unit: string;

  unitPrice: number;
  currency: "INR" | "AED" | "USD" | "EUR" | "GBP";

  taxRate: number;

  hsnSac?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

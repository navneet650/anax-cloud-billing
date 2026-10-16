import { api } from "./api/client";
import type { Product } from "../types/product";

type ApiProduct = Omit<Product, "id"> & {
  companyId: string;
  productId: string;
};

type ListResponse = {
  items: ApiProduct[];
  count: number;
};

function fromApi(raw: ApiProduct): Product {
  const { productId, companyId, ...rest } = raw;
  void companyId;
  return {
    id: productId,
    name: rest.name ?? "",
    sku: rest.sku ?? "",
    description: rest.description ?? "",
    type: rest.type ?? "Service",
    unit: rest.unit ?? "Hour",
    unitPrice: rest.unitPrice ?? 0,
    currency: rest.currency ?? "INR",
    taxRate: rest.taxRate ?? 18,
    hsnSac: rest.hsnSac ?? "",
    isActive: rest.isActive ?? true,
    createdAt: rest.createdAt ?? "",
    updatedAt: rest.updatedAt ?? "",
  };
}

function toApi(p: Partial<Product>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.sku !== undefined) out.sku = p.sku;
  if (p.description !== undefined) out.description = p.description;
  if (p.type !== undefined) out.type = p.type;
  if (p.unit !== undefined) out.unit = p.unit;
  if (p.unitPrice !== undefined) out.unitPrice = p.unitPrice;
  if (p.currency !== undefined) out.currency = p.currency;
  if (p.taxRate !== undefined) out.taxRate = p.taxRate;
  if (p.hsnSac !== undefined) out.hsnSac = p.hsnSac;
  if (p.isActive !== undefined) out.isActive = p.isActive;
  return out;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const res = await api.get<ListResponse>("/products");
    return (res.items || []).map(fromApi);
  },

  async add(product: Product): Promise<Product> {
    const res = await api.post<ApiProduct>("/products", toApi(product));
    return fromApi(res);
  },

  async update(product: Product): Promise<Product> {
    const res = await api.put<ApiProduct>(
      `/products/${encodeURIComponent(product.id)}`,
      toApi(product)
    );
    return fromApi(res);
  },

  async delete(id: string): Promise<void> {
    await api.del<{ deleted: boolean }>(
      `/products/${encodeURIComponent(id)}`
    );
  },
};

import type { Product } from "../types/product";

const STORAGE_KEY = "products";

export const productService = {
  getAll(): Product[] {
    const data = localStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];
  },

  saveAll(products: Product[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );
  },

  add(product: Product) {
    const products = this.getAll();

    products.push(product);

    this.saveAll(products);
  },

  update(product: Product) {
    const products = this.getAll().map((item) =>
      item.id === product.id ? product : item
    );

    this.saveAll(products);
  },

  delete(id: string) {
    const products = this.getAll().filter(
      (product) => product.id !== id
    );

    this.saveAll(products);
  },
};

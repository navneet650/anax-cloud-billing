import { useState } from "react";
import type { Product } from "../../types/product";
import { productService } from "../../services/productService";

const tableHeaderStyle = {
  textAlign: "left" as const,
  padding: "16px",
  fontSize: "14px",
  color: "#374151",
  fontWeight: 600,
};

const tableCellStyle = {
  padding: "18px 16px",
  fontSize: "14px",
  color: "#374151",
  verticalAlign: "top" as const,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = productService.getAll();

    if (savedProducts.length > 0) {
      return savedProducts;
    }

    const now = new Date().toISOString();

    const sampleProducts: Product[] = [
      {
        id: "prod-001",
        name: "AWS Cloud Consulting",
        sku: "AWS-CONSULT",
        description:
          "AWS cloud consulting and architecture services",
        type: "Service",
        unit: "Hour",
        unitPrice: 2500,
        currency: "INR",
        taxRate: 18,
        hsnSac: "998314",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prod-002",
        name: "Cloud Infrastructure Management",
        sku: "CLOUD-MGMT",
        description:
          "Managed cloud infrastructure and monitoring",
        type: "Service",
        unit: "Month",
        unitPrice: 15000,
        currency: "INR",
        taxRate: 18,
        hsnSac: "998315",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    productService.saveAll(sampleProducts);

    return sampleProducts;
  });

  const [showAddProduct, setShowAddProduct] = useState(false);

  const [editingProductId, setEditingProductId] =
  useState<string | null>(null);

const [name, setName] = useState("");
const [sku, setSku] = useState("");
const [description, setDescription] = useState("");
const [type, setType] = useState<"Product" | "Service">("Service");
const [unit, setUnit] = useState("Hour");
const [unitPrice, setUnitPrice] = useState("");
const [currency, setCurrency] = useState<
  "INR" | "AED" | "USD" | "EUR" | "GBP"
>("INR");
const [taxRate, setTaxRate] = useState("18");
const [hsnSac, setHsnSac] = useState("");
const [isActive, setIsActive] = useState(true);

const saveProduct = () => {
  if (!name.trim()) {
    window.alert("Please enter a product or service name.");
    return;
  }

  if (!sku.trim()) {
    window.alert("Please enter an SKU.");
    return;
  }

  if (!unitPrice || Number(unitPrice) < 0) {
    window.alert("Please enter a valid unit price.");
    return;
  }

const now = new Date().toISOString();

const productData: Product = {
  id: editingProductId ?? `prod-${Date.now()}`,
  name: name.trim(),
  sku: sku.trim(),
  description: description.trim(),
  type,
  unit,
  unitPrice: Number(unitPrice),
  currency,
  taxRate: Number(taxRate),
  hsnSac: hsnSac.trim() || undefined,
  isActive,
  createdAt:
    editingProductId
      ? products.find(
          (product) => product.id === editingProductId
        )?.createdAt ?? now
      : now,
  updatedAt: now,
};

if (editingProductId) {
  productService.update(productData);

  setProducts((current) =>
    current.map((product) =>
      product.id === editingProductId
        ? productData
        : product
    )
  );
} else {
  productService.add(productData);

  setProducts((current) => [
    ...current,
    productData,
  ]);
}

setEditingProductId(null);

setName("");
setSku("");
setDescription("");
setType("Service");
setUnit("Hour");
setUnitPrice("");
setCurrency("INR");
setTaxRate("18");
setHsnSac("");
setIsActive(true);

setShowAddProduct(false);
};
const deleteProduct = (id: string) => {
  const product = products.find(
    (item) => item.id === id
  );

  if (!product) {
    return;
  }

  const confirmed = window.confirm(
    `Delete "${product.name}"?`
  );

  if (!confirmed) {
    return;
  }

  productService.delete(id);

  setProducts((current) =>
    current.filter((item) => item.id !== id)
  );
};
  return (
    <div
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              color: "#111827",
            }}
          >
            Products & Services
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
              fontSize: "16px",
            }}
          >
            Manage products and services used for invoicing
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddProduct(true)}
          style={{
            background: "#f59e0b",
            color: "#111827",
            border: "none",
            borderRadius: "8px",
            padding: "14px 22px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Product
        </button>
      </div>

      {/* PRODUCT TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>SKU</th>
              <th style={tableHeaderStyle}>Type</th>
              <th style={tableHeaderStyle}>Unit</th>
              <th style={tableHeaderStyle}>Price</th>
              <th style={tableHeaderStyle}>Tax</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <td style={tableCellStyle}>
                  <strong>{product.name}</strong>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    {product.description}
                  </div>
                </td>

                <td style={tableCellStyle}>
                  {product.sku}
                </td>

                <td style={tableCellStyle}>
                  {product.type}
                </td>

                <td style={tableCellStyle}>
                  {product.unit}
                </td>

                <td style={tableCellStyle}>
                  {product.currency}{" "}
                  {product.unitPrice.toLocaleString()}
                </td>

                <td style={tableCellStyle}>
                  {product.taxRate}%
                </td>

                <td style={tableCellStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      background: product.isActive
                        ? "#dcfce7"
                        : "#e5e7eb",
                      color: product.isActive
                        ? "#166534"
                        : "#374151",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {product.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td style={tableCellStyle}>
  <div
    style={{
      display: "flex",
      gap: "12px",
      alignItems: "center",
    }}
  >
    <button
      type="button"
      onClick={() => {
        setEditingProductId(product.id);
        setName(product.name);
        setSku(product.sku);
        setDescription(product.description);
        setType(product.type);
        setUnit(product.unit);
        setUnitPrice(String(product.unitPrice));
        setCurrency(product.currency);
        setTaxRate(String(product.taxRate));
        setHsnSac(product.hsnSac || "");
        setIsActive(product.isActive);
        setShowAddProduct(true);
      }}
      style={{
        border: "none",
        background: "transparent",
        color: "#2563eb",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() => deleteProduct(product.id)}
      style={{
        border: "none",
        background: "transparent",
        color: "#dc2626",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Delete
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
               </table>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    color: "#111827",
                  }}
                >
                  Add Product / Service
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Add a product or service for invoicing
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "26px",
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <div style={{ padding: "28px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* NAME */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Name *
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="AWS Cloud Consulting"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* SKU */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    SKU *
                  </label>

                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="AWS-CONSULT"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* TYPE */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Type
                  </label>

                  <select
                    value={type}
                    onChange={(e) =>
                      setType(
                        e.target.value as
                          | "Product"
                          | "Service"
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "#ffffff",
                    }}
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                  </select>
                </div>

                {/* UNIT */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Unit
                  </label>

                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Hour"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* UNIT PRICE */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Unit Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) =>
                      setUnitPrice(e.target.value)
                    }
                    placeholder="2500"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* CURRENCY */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Currency
                  </label>

                  <select
                    value={currency}
                    onChange={(e) =>
                      setCurrency(
                        e.target.value as
                          | "INR"
                          | "AED"
                          | "USD"
                          | "EUR"
                          | "GBP"
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "#ffffff",
                    }}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                {/* TAX RATE */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Tax Rate (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(e.target.value)
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* HSN/SAC */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    HSN / SAC
                  </label>

                  <input
                    value={hsnSac}
                    onChange={(e) =>
                      setHsnSac(e.target.value)
                    }
                    placeholder="998314"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div style={{ marginTop: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the product or service"
                  rows={4}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* ACTIVE */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                  color: "#374151",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) =>
                    setIsActive(e.target.checked)
                  }
                />
                Active
              </label>
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                padding: "18px 28px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                style={{
                  padding: "12px 20px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProduct}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  background: "#f59e0b",
                  color: "#111827",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
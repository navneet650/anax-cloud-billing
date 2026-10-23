import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Invoice, InvoiceItem } from "../../types/invoice";
import type { Customer } from "../../types/customer";
import type { Product } from "../../types/product";
import { customerService } from "../../services/customerService";
import { productService } from "../../services/productService";
import { invoiceService } from "../../services/invoiceService";
import { formatCurrency } from "./helpers";

type Props = {
  invoice: Invoice | null;
  onClose: () => void;
  onSaved: (saved: Invoice) => void;
};

const currencies = ["INR", "AED", "USD", "EUR", "GBP"] as const;

export default function InvoiceForm({ invoice, onClose, onSaved }: Props) {
  const isEdit = invoice !== null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || "");
  const [invoiceDate, setInvoiceDate] = useState(
    invoice?.date || new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate || "");
  const [poNumber, setPoNumber] = useState(invoice?.poNumber || "");
  const [placeOfSupply, setPlaceOfSupply] = useState(invoice?.placeOfSupply || "");
  const [invoiceDescription, setInvoiceDescription] = useState(
    invoice?.invoiceDescription || ""
  );
  const [notes, setNotes] = useState(invoice?.notes || "");
  const [currency, setCurrency] = useState<Invoice["currency"]>(
    invoice?.currency || "INR"
  );
  const [status, setStatus] = useState<Invoice["status"]>(invoice?.status || "Draft");

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items && invoice.items.length > 0
      ? invoice.items.map((it, i) => ({ ...it, id: i + 1 }))
      : [{ id: 1, description: "", hsnSac: "", quantity: 1, unitPrice: 0, taxRate: 18 }]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([customerService.getAll(), productService.getAll()])
      .then(([custs, prods]) => {
        if (cancelled) return;
        setCustomers(custs.filter((c) => c.isActive));
        setProducts(prods.filter((p) => p.isActive));
        if (invoice) {
          const match = custs.find((c) => c.companyName === invoice.customer);
          if (match) setCustomerId(match.id);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q)
    );
  });

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxTotal = items.reduce(
    (s, it) => s + (it.quantity * it.unitPrice * it.taxRate) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((cur) =>
      cur.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => {
    setItems((cur) => [
      ...cur,
      {
        id: Date.now(),
        description: "",
        hsnSac: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((cur) => cur.filter((it) => it.id !== id));
  };

  const selectProduct = (itemId: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((cur) =>
      cur.map((it) =>
        it.id === itemId
          ? {
              ...it,
              productId,
              description: p.name,
              hsnSac: p.hsnSac || "",
              unitPrice: p.unitPrice,
              taxRate: p.taxRate,
            }
          : it
      )
    );
  };

  const handleSave = async () => {
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    if (!invoiceDate) {
      setError("Please select an invoice date");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      setError("Every line item needs a description");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        customer: selectedCustomer?.companyName || "",
        customerId: selectedCustomer?.id || null,
        customerGstin: selectedCustomer?.gstin || "",
        customerEmail: selectedCustomer?.email || "",
        invoiceNumber: invoiceNumber || undefined,
        date: invoiceDate,
        dueDate,
        poNumber,
        placeOfSupply,
        invoiceDescription,
        notes,
        currency,
        status,
        items,
      };

      const saved = isEdit && invoice
        ? await invoiceService.update(invoice.id, payload)
        : await invoiceService.add(payload);

      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{isEdit ? "Edit Invoice" : "Create Invoice"}</h2>
            <p style={styles.subtitle}>
              {isEdit ? "Update invoice details" : "Create a new invoice"}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div style={styles.body}>
          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Invoice Details</h3>
            <div style={styles.grid}>
              <label style={styles.field}>
                <span style={styles.label}>Invoice Number</span>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Auto-generated"
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Invoice Date *</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Due Date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Invoice["currency"])}
                  style={styles.input}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                <span style={styles.label}>PO Number</span>
                <input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Optional"
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Place of Supply</span>
                <input
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="e.g. 08 - Rajasthan"
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Invoice["status"])}
                  style={styles.input}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Customer *</h3>
            {selectedCustomer ? (
              <div style={styles.customerSelected}>
                <div>
                  <strong>{selectedCustomer.companyName}</strong>
                  <div style={styles.customerMeta}>
                    {selectedCustomer.contactPerson} • {selectedCustomer.email}
                    {selectedCustomer.gstin ? ` • ${selectedCustomer.gstin}` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => setCustomerId("")} style={styles.linkBtn}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email, or GSTIN..."
                  style={styles.input}
                />
                <div style={styles.customerList}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                      No customers found.
                    </div>
                  ) : (
                    filteredCustomers.slice(0, 8).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerSearch("");
                        }}
                        style={styles.customerOption}
                      >
                        <div style={{ fontWeight: 600, color: "#111827" }}>{c.companyName}</div>
                        <div style={styles.customerMeta}>
                          {c.contactPerson} {c.email ? `• ${c.email}` : ""} {c.gstin ? `• ${c.gstin}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          <section style={styles.section}>
            <div style={styles.itemsHeader}>
              <h3 style={styles.sectionTitle}>Line Items *</h3>
              <button type="button" onClick={addItem} style={styles.secondaryBtn}>
                + Add Item
              </button>
            </div>
            <div style={styles.itemsTableWrap}>
              <table style={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product/Description</th>
                    <th style={styles.thSmall}>HSN/SAC</th>
                    <th style={styles.thSmall}>Qty</th>
                    <th style={styles.thSmall}>Unit Price</th>
                    <th style={styles.thSmall}>Tax %</th>
                    <th style={styles.thSmall}>Amount</th>
                    <th style={styles.thSmall}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const amount = it.quantity * it.unitPrice;
                    return (
                      <tr key={it.id}>
                        <td style={styles.td}>
                          <select
                            value={it.productId || ""}
                            onChange={(e) => {
                              if (e.target.value) selectProduct(it.id, e.target.value);
                              else updateItem(it.id, "productId", "");
                            }}
                            style={styles.smallInput}
                          >
                            <option value="">— Select product or type custom —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.currency} {p.unitPrice})
                              </option>
                            ))}
                          </select>
                          <textarea
                            value={it.description}
                            onChange={(e) => updateItem(it.id, "description", e.target.value)}
                            placeholder="Free text description (e.g. benappl-xxx && AI Platform work)"
                            rows={2}
                            style={{ ...styles.smallInput, marginTop: 6, resize: "vertical", fontFamily: "inherit" }}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            value={it.hsnSac || ""}
                            onChange={(e) => updateItem(it.id, "hsnSac", e.target.value)}
                            placeholder="998314"
                            style={styles.smallInput}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="0"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.id, "quantity", Number(e.target.value))}
                            style={styles.smallInput}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(it.id, "unitPrice", Number(e.target.value))}
                            style={styles.smallInput}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={it.taxRate}
                            onChange={(e) => updateItem(it.id, "taxRate", Number(e.target.value))}
                            style={styles.smallInput}
                          />
                        </td>
                        <td style={{ ...styles.td, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {formatCurrency(amount, currency)}
                        </td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            disabled={items.length <= 1}
                            style={styles.removeBtn}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Notes / Description</h3>
            <textarea
              value={invoiceDescription}
              onChange={(e) => setInvoiceDescription(e.target.value)}
              placeholder="Optional invoice-level description"
              rows={3}
              style={{ ...styles.input, fontFamily: "inherit", resize: "vertical" }}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal notes"
              rows={2}
              style={{ ...styles.input, fontFamily: "inherit", resize: "vertical", marginTop: 10 }}
            />
          </section>

          <div style={styles.totalsArea}>
            <div style={styles.totalsBox}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Tax</span>
                <span>{formatCurrency(taxTotal, currency)}</span>
              </div>
              <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: 16, borderTop: "2px solid #e5e7eb", paddingTop: 12, marginTop: 6 }}>
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button type="button" onClick={onClose} disabled={saving} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
            {saving ? "Saving..." : isEdit ? "Update Invoice" : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,23,42,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    width: "100%", maxWidth: 1100, maxHeight: "92vh",
    background: "#ffffff", borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#6b7280" },
  closeBtn: {
    width: 36, height: 36, border: "none", borderRadius: 8,
    background: "#f8fafc", color: "#64748b", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  body: { padding: 24, overflowY: "auto", flex: 1 },
  errorBox: {
    padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, color: "#991b1b", fontSize: 13, marginBottom: 18,
  },
  section: { marginBottom: 24 },
  sectionTitle: { margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111827" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: {
    width: "100%", padding: "10px 12px",
    border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, background: "#fff", boxSizing: "border-box", outline: "none",
  },
  customerSelected: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: 14, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb",
  },
  customerMeta: { fontSize: 12, color: "#6b7280", marginTop: 3 },
  linkBtn: {
    border: "none", background: "transparent",
    color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13,
  },
  customerList: {
    border: "1px solid #d1d5db", borderRadius: 8, marginTop: 6, maxHeight: 220, overflowY: "auto",
  },
  customerOption: { padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #eef0f2" },
  itemsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  secondaryBtn: {
    border: "1px solid #b9d7ef", borderRadius: 8, padding: "8px 14px",
    background: "#f4f9fd", color: "#0f5fa8", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  itemsTableWrap: { border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto", marginTop: 12 },
  itemsTable: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  thSmall: { padding: "10px 8px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td: { padding: "10px 8px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
  smallInput: {
    width: "100%", padding: "7px 8px", border: "1px solid #d1d5db",
    borderRadius: 6, fontSize: 12, boxSizing: "border-box",
  },
  removeBtn: {
    border: "none", background: "transparent",
    color: "#dc2626", fontSize: 18, cursor: "pointer", fontWeight: 700,
  },
  totalsArea: { display: "flex", justifyContent: "flex-end" },
  totalsBox: {
    width: 340, border: "1px solid #e5e7eb", borderRadius: 10,
    padding: 16, background: "#f9fafb",
  },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#374151", fontSize: 14 },
  footer: {
    padding: "16px 24px", borderTop: "1px solid #e5e7eb",
    display: "flex", justifyContent: "flex-end", gap: 10,
  },
  cancelBtn: {
    border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 18px",
    background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  primaryBtn: {
    border: "none", borderRadius: 8, padding: "10px 20px",
    background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
};

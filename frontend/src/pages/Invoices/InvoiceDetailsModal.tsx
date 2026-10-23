import { useState } from "react";
import { X, Download, Send } from "lucide-react";
import type { Invoice } from "../../types/invoice";
import { invoiceService } from "../../services/invoiceService";
import {
  formatCurrency,
  formatDate,
  getSmartInvoiceStatus,
  statusBadgeStyle,
} from "./helpers";

type Props = {
  invoice: Invoice;
  onClose: () => void;
  onUpdated: (updated: Invoice) => void;
};

export default function InvoiceDetailsModal({ invoice, onClose, onUpdated }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const smartStatus = getSmartInvoiceStatus(invoice);
  const badge = statusBadgeStyle(smartStatus);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await invoiceService.getPdf(invoice.id);
      window.open(res.url, "_blank");
      setMessage("PDF opened in new tab (valid 1 hour)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleSend = async () => {
    if (!invoice.customer) {
      setError("Invoice has no customer");
      return;
    }
    const confirmed = window.confirm(
      `Send invoice ${invoice.invoiceNumber} to the customer via email?`
    );
    if (!confirmed) return;

    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await invoiceService.send(invoice.id);
      setMessage(`Sent to ${res.to}`);
      const refreshed = await invoiceService.getAll();
      const match = refreshed.find((i) => i.id === invoice.id);
      if (match) onUpdated(match);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={styles.title}>{invoice.invoiceNumber}</h2>
              <span style={{ ...styles.badge, ...badge }}>{smartStatus}</span>
            </div>
            <p style={styles.subtitle}>{invoice.customer}</p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.errorBox}>{error}</div>}
          {message && <div style={styles.successBox}>{message}</div>}

          <div style={styles.grid}>
            <Field label="Invoice Date" value={formatDate(invoice.date)} />
            <Field label="Due Date" value={invoice.dueDate ? formatDate(invoice.dueDate) : "—"} />
            <Field label="PO Number" value={invoice.poNumber || "—"} />
            <Field label="Place of Supply" value={invoice.placeOfSupply || "—"} />
            <Field label="Currency" value={invoice.currency} />
            <Field label="Grand Total" value={formatCurrency(invoice.amount, invoice.currency)} highlight />
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Line Items</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Description</th>
                    <th style={styles.thNum}>HSN/SAC</th>
                    <th style={styles.thNum}>Qty</th>
                    <th style={styles.thNum}>Price</th>
                    <th style={styles.thNum}>Tax %</th>
                    <th style={styles.thNum}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it) => (
                    <tr key={it.id}>
                      <td style={styles.td}>{it.description}</td>
                      <td style={styles.tdNum}>{it.hsnSac || "—"}</td>
                      <td style={styles.tdNum}>{it.quantity}</td>
                      <td style={styles.tdNum}>{formatCurrency(it.unitPrice, invoice.currency)}</td>
                      <td style={styles.tdNum}>{it.taxRate}%</td>
                      <td style={styles.tdNum}>
                        {formatCurrency(it.quantity * it.unitPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {invoice.invoiceDescription && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.text}>{invoice.invoiceDescription}</p>
            </section>
          )}

          {invoice.notes && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Notes</h3>
              <p style={styles.text}>{invoice.notes}</p>
            </section>
          )}
        </div>

        <div style={styles.footer}>
          <button type="button" onClick={handleDownload} disabled={downloading} style={styles.secondaryBtn}>
            <Download size={16} />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
          <button type="button" onClick={handleSend} disabled={sending} style={styles.primaryBtn}>
            <Send size={16} />
            {sending ? "Sending..." : "Send to Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={{ ...styles.fieldValue, ...(highlight ? styles.fieldValueHighlight : {}) }}>
        {value}
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
    width: "100%", maxWidth: 900, maxHeight: "90vh",
    background: "#fff", borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#6b7280" },
  badge: {
    padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
  },
  closeBtn: {
    width: 36, height: 36, border: "none", borderRadius: 8,
    background: "#f8fafc", color: "#64748b", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  body: { padding: 24, overflowY: "auto", flex: 1 },
  errorBox: {
    padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, color: "#991b1b", fontSize: 13, marginBottom: 14,
  },
  successBox: {
    padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 8, color: "#166534", fontSize: 13, marginBottom: 14,
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14, marginBottom: 24,
  },
  field: { padding: "10px 12px", background: "#f9fafb", borderRadius: 8 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: "#111827", marginTop: 4, fontWeight: 500 },
  fieldValueHighlight: { fontSize: 18, fontWeight: 700, color: "#0f5fa8" },
  section: { marginBottom: 20 },
  sectionTitle: { margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#111827" },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  thNum: { padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#374151", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f1f5f9" },
  tdNum: { padding: "10px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f1f5f9", textAlign: "right" },
  text: { margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 },
  footer: {
    padding: "16px 24px", borderTop: "1px solid #e5e7eb",
    display: "flex", justifyContent: "flex-end", gap: 10,
  },
  secondaryBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 18px",
    background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  primaryBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: "none", borderRadius: 8, padding: "10px 20px",
    background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
};

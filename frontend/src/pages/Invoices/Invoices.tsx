import { useState, useEffect } from "react";
import { Plus, Eye, Pencil, Download, Send, Trash2 } from "lucide-react";
import type { Invoice } from "../../types/invoice";
import { invoiceService } from "../../services/invoiceService";
import {
  formatCurrency,
  formatDate,
  getSmartInvoiceStatus,
  statusBadgeStyle,
  type SmartInvoiceStatus,
} from "./helpers";
import InvoiceForm from "./InvoiceForm";
import InvoiceDetailsModal from "./InvoiceDetailsModal";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SmartInvoiceStatus>("All");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadInvoices = () => {
    setLoading(true);
    invoiceService
      .getAll()
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load invoices");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    setActionError(null);
    try {
      const res = await invoiceService.getPdf(invoice.id);
      window.open(res.url, "_blank");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSend = async (invoice: Invoice) => {
    if (!window.confirm(`Send ${invoice.invoiceNumber} to ${invoice.customer} via email?`)) return;
    setSendingId(invoice.id);
    setActionError(null);
    try {
      await invoiceService.send(invoice.id);
      loadInvoices();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!window.confirm(`Delete ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await invoiceService.delete(invoice.id);
      setInvoices((cur) => cur.filter((i) => i.id !== invoice.id));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete invoice");
    }
  };

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q);
    const smart = getSmartInvoiceStatus(inv);
    const matchesStatus = statusFilter === "All" || smart === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontSize: 16 }}>
        Loading invoices...
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 16 }}>
        {loadError}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Invoices</h1>
          <p style={styles.subtitle}>Create, manage, and send GST invoices</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingInvoice(null);
            setShowForm(true);
          }}
          style={styles.primaryBtn}
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {actionError && <div style={styles.errorBox}>{actionError}</div>}

      <div style={styles.filterBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number or customer..."
          style={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "All" | SmartInvoiceStatus)}
          style={styles.filterSelect}
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Due Today">Due Today</option>
          <option value="Overdue">Overdue</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            {invoices.length === 0
              ? "Click New Invoice to create your first invoice."
              : "Try changing your search or filter."}
          </div>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Invoice Date</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.thNum}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const smart = getSmartInvoiceStatus(inv);
                const badge = statusBadgeStyle(smart);
                return (
                  <tr key={inv.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong style={{ color: "#111827" }}>{inv.invoiceNumber}</strong>
                    </td>
                    <td style={styles.td}>{inv.customer}</td>
                    <td style={styles.td}>{formatDate(inv.date)}</td>
                    <td style={styles.td}>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td style={styles.tdNum}>{formatCurrency(inv.amount, inv.currency)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...badge }}>{smart}</span>
                    </td>
                    <td style={styles.tdActions}>
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(inv)}
                        title="View"
                        style={styles.iconBtn}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvoice(inv);
                          setShowForm(true);
                        }}
                        title="Edit"
                        style={styles.iconBtn}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(inv)}
                        disabled={downloadingId === inv.id}
                        title="Download PDF"
                        style={styles.iconBtn}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSend(inv)}
                        disabled={sendingId === inv.id}
                        title="Send Email"
                        style={styles.iconBtn}
                      >
                        <Send size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        title="Delete"
                        style={{ ...styles.iconBtn, color: "#dc2626" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          onSaved={(saved) => {
            setShowForm(false);
            setEditingInvoice(null);
            setInvoices((cur) => {
              const exists = cur.find((i) => i.id === saved.id);
              if (exists) return cur.map((i) => (i.id === saved.id ? saved : i));
              return [saved, ...cur];
            });
          }}
        />
      )}

      {viewingInvoice && (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onUpdated={(updated) => {
            setInvoices((cur) => cur.map((i) => (i.id === updated.id ? updated : i)));
            setViewingInvoice(updated);
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, minHeight: "100%", background: "#f8fafc" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24, gap: 20,
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: "#0f3d6e" },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 14 },
  primaryBtn: {
    display: "flex", alignItems: "center", gap: 8,
    border: "none", borderRadius: 10, padding: "11px 20px",
    background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
  },
  errorBox: {
    padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, color: "#991b1b", fontSize: 13, marginBottom: 16,
  },
  filterBar: {
    display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap",
  },
  searchInput: {
    flex: 1, minWidth: 280, padding: "10px 12px",
    border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff",
  },
  filterSelect: {
    padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, background: "#fff", minWidth: 160,
  },
  tableWrap: {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700,
    color: "#64748b", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  thNum: {
    padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700,
    color: "#64748b", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  thActions: {
    padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700,
    color: "#64748b", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 16px", fontSize: 14, color: "#374151", verticalAlign: "middle" },
  tdNum: { padding: "14px 16px", fontSize: 14, color: "#374151", textAlign: "right", verticalAlign: "middle", fontWeight: 600 },
  tdActions: { padding: "14px 16px", textAlign: "right", verticalAlign: "middle", whiteSpace: "nowrap" },
  badge: { padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  iconBtn: {
    border: "none", background: "transparent", color: "#475569",
    cursor: "pointer", padding: 6, marginLeft: 4, borderRadius: 6,
  },
  emptyState: {
    padding: "60px 20px", textAlign: "center", background: "#fff",
    borderRadius: 12, border: "1px solid #e5e7eb",
  },
};

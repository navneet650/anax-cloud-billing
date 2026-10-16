import { useState, useEffect } from "react";
import type { Customer } from "../../types/customer";
import { customerService } from "../../services/customerService";

import {
  Search,
  Plus,
  Users,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [state, setState] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Silenced for now — will be used by error banners + save button in a later polish pass
  void actionError;
  void saving;

  useEffect(() => {
    let cancelled = false;
    customerService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load customers";
        setLoadError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setMobile("");
    setGstin("");
    setPan("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPincode("");
    setCountry("India");
    setEditingCustomerId(null);
    setActionError(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleAddCustomer = () => {
    resetForm();
    setOpen(true);
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert("Please enter Company Name");
      return;
    }

    if (!contactPerson.trim()) {
      alert("Please enter Contact Person");
      return;
    }

    setSaving(true);
    setActionError(null);

    const now = new Date().toISOString();

    try {
      if (editingCustomerId) {
        const existing = rows.find((c) => c.id === editingCustomerId);
        if (!existing) {
          setActionError("Customer not found");
          setSaving(false);
          return;
        }

        const updated: Customer = {
          ...existing,
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          gstin: gstin.trim(),
          pan: pan.trim().toUpperCase(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim(),
          updatedAt: now,
        };

        const saved = await customerService.update(updated);
        setRows((current) =>
          current.map((c) => (c.id === saved.id ? saved : c))
        );
      } else {
        const newCustomer: Customer = {
          id: "",
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          gstin: gstin.trim(),
          pan: pan.trim().toUpperCase(),
          email: email.trim(),
          mobile: mobile.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim(),
          customerType: "Business",
          paymentTerms: 30,
          creditLimit: 0,
          gstRegistered: Boolean(gstin.trim()),
          isActive: true,
          notes: "",
          createdAt: now,
          updatedAt: now,
        };

        const saved = await customerService.add(newCustomer);
        setRows((current) => [...current, saved]);
      }

      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save customer";
      setActionError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setCompanyName(customer.companyName || "");
    setContactPerson(customer.contactPerson || "");
    setEmail(customer.email || "");
    setMobile(customer.mobile || "");
    setGstin(customer.gstin || "");
    setPan(customer.pan || "");
    setAddressLine1(customer.addressLine1 || "");
    setAddressLine2(customer.addressLine2 || "");
    setCity(customer.city || "");
    setState(customer.state || "");
    setPincode(customer.pincode || "");
    setCountry(customer.country || "India");
    setActionError(null);
    setOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.companyName}?`
    );

    if (!confirmed) return;

    try {
      await customerService.delete(customer.id);
      setRows((current) => current.filter((c) => c.id !== customer.id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete customer";
      setActionError(message);
    }
  };

  const filteredRows = rows.filter((customer) => {
    const query = search.toLowerCase();

    return (
      customer.companyName.toLowerCase().includes(query) ||
      customer.contactPerson.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.mobile.toLowerCase().includes(query) ||
      customer.gstin.toLowerCase().includes(query) ||
      customer.state.toLowerCase().includes(query)
    );
  });

  const totalCustomers = rows.length;
  const activeCustomers = rows.filter((c) => c.isActive).length;
  const gstCustomers = rows.filter((c) => c.gstin && c.gstin.trim()).length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontSize: 16 }}>
        Loading customers...
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
      {/* PAGE HEADER */}
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              <Users size={26} />
            </div>

            <div>
              <h1 style={styles.pageTitle}>Customers</h1>
              <p style={styles.pageSubtitle}>
                Manage your customers and business contacts
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          style={styles.primaryButton}
          onClick={handleAddCustomer}
        >
          <Plus size={19} />
          Add Customer
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.summaryGrid}>
        <SummaryCard
          title="Total Customers"
          value={String(totalCustomers)}
          icon={<Users size={22} />}
          accent="#2563eb"
        />

        <SummaryCard
          title="Active Customers"
          value={String(activeCustomers)}
          icon={<UserCheck size={22} />}
          accent="#059669"
        />

        <SummaryCard
          title="GST Registered"
          value={String(gstCustomers)}
          icon={<Building2 size={22} />}
          accent="#d97706"
        />
      </div>

      {/* CUSTOMER LIST */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Customer Directory</h2>
            <p style={styles.cardSubtitle}>
              {filteredRows.length} customer
              {filteredRows.length !== 1 ? "s" : ""} displayed
            </p>
          </div>

          <div style={styles.searchBox}>
            <Search size={18} color="#64748b" />

            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>GSTIN</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>State</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>
                        <Users size={28} />
                      </div>

                      <strong>No customers found</strong>

                      <span>
                        Try changing your search or add a new customer.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((customer) => (
                  <tr key={customer.id}>
                    <td style={styles.td}>
                      <div style={styles.customerName}>
                        <div style={styles.avatar}>
                          {customer.companyName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div style={styles.companyName}>
                            {customer.companyName}
                          </div>

                          <div style={styles.contactName}>
                            {customer.contactPerson}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      {customer.contactPerson || "—"}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.contactInfo}>
                        <Mail size={14} />
                        {customer.email || "—"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {customer.gstin ? (
                        <span style={styles.gstinBadge}>
                          {customer.gstin}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.contactInfo}>
                        <Phone size={14} />
                        {customer.mobile || "—"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {customer.state || "—"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={
                          customer.isActive
                            ? styles.activeBadge
                            : styles.inactiveBadge
                        }
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          type="button"
                          style={styles.editButton}
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          style={styles.deleteButton}
                          onClick={() => handleDelete(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {open && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingCustomerId
                    ? "Edit Customer"
                    : "Add New Customer"}
                </h2>

                <p style={styles.modalSubtitle}>
                  Enter the customer details below
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={handleClose}
              >
                <X size={22} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <FormField label="Company Name *">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) =>
                      setCompanyName(e.target.value)
                    }
                    placeholder="Enter company name"
                    style={styles.input}
                  />
                </FormField>

                <FormField label="Contact Person *">
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) =>
                      setContactPerson(e.target.value)
                    }
                    placeholder="Enter contact person"
                    style={styles.input}
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={styles.input}
                  />
                </FormField>

                <FormField label="Mobile">
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter mobile number"
                    style={styles.input}
                  />
                </FormField>

                <FormField label="GSTIN">
  <input
    type="text"
    value={gstin}
    onChange={(e) => setGstin(e.target.value)}
    placeholder="Enter GSTIN"
    style={styles.input}
  />
</FormField>

<FormField label="PAN">
  <input
    type="text"
    value={pan}
    onChange={(e) => setPan(e.target.value.toUpperCase())}
    placeholder="Enter PAN"
    style={styles.input}
  />
</FormField>

<FormField label="Address Line 1">
  <input
    type="text"
    value={addressLine1}
    onChange={(e) =>
      setAddressLine1(e.target.value)
    }
    placeholder="Enter address"
    style={styles.input}
  />
</FormField>

<FormField label="Address Line 2">
  <input
    type="text"
    value={addressLine2}
    onChange={(e) =>
      setAddressLine2(e.target.value)
    }
    placeholder="Apartment, area, landmark"
    style={styles.input}
  />
</FormField>

<FormField label="City">
  <input
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    placeholder="Enter city"
    style={styles.input}
  />
</FormField>

<FormField label="State">
  <input
    type="text"
    value={state}
    onChange={(e) => setState(e.target.value)}
    placeholder="Enter state"
    style={styles.input}
  />
</FormField>

<FormField label="PIN Code">
  <input
    type="text"
    value={pincode}
    onChange={(e) =>
      setPincode(e.target.value)
    }
    placeholder="Enter PIN code"
    style={styles.input}
  />
</FormField>

<FormField label="Country">
  <input
    type="text"
    value={country}
    onChange={(e) =>
      setCountry(e.target.value)
    }
    placeholder="Enter country"
    style={styles.input}
  />
</FormField>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={handleClose}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={handleSave}
              >
                {editingCustomerId
                  ? "Save Changes"
                  : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function SummaryCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div style={styles.summaryCard}>
      <div
        style={{
          ...styles.summaryIcon,
          background: `${accent}15`,
          color: accent,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={styles.summaryTitle}>{title}</div>
        <div style={styles.summaryValue}>{value}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.formField}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

/* ---------- STYLES ---------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 32,
    minHeight: "100%",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #f3f8ff 0%, #f8fbff 45%, #f4f7fb 100%)",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  titleIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    background: "#eaf2ff",
  },

  pageTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 750,
    color: "#172033",
  },

  pageSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 14,
  },

  primaryButton: {
    border: "none",
    borderRadius: 10,
    padding: "11px 18px",
    background: "#f59e0b",
    color: "#172033",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 5px 14px rgba(245, 158, 11, 0.2)",
    whiteSpace: "nowrap",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  summaryCard: {
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #e4ebf5",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    alignItems: "center",
    gap: 15,
    boxShadow: "0 5px 20px rgba(31, 51, 84, 0.05)",
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryTitle: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 5,
  },

  summaryValue: {
    color: "#172033",
    fontSize: 26,
    fontWeight: 750,
  },

  card: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid #e4ebf5",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(31, 51, 84, 0.06)",
  },

  cardHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #e9eef5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 750,
    color: "#172033",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    fontSize: 13,
    color: "#64748b",
  },

  searchBox: {
    width: 280,
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 13px",
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    background: "#f8fafc",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#172033",
    fontSize: 13,
  },

  tableContainer: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1150,
  },

  th: {
    padding: "14px 16px",
    textAlign: "left",
    background: "#f7f9fc",
    borderBottom: "1px solid #e7edf5",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 16px",
    borderBottom: "1px solid #edf1f6",
    color: "#475569",
    fontSize: 13,
    verticalAlign: "middle",
  },

  customerName: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#eaf2ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 750,
    flexShrink: 0,
  },

  companyName: {
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 3,
  },

  contactName: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "left",
  },

  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  },

  gstinBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: 6,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 11,
    color: "#475569",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  activeBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 12,
    fontWeight: 700,
  },

  inactiveBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 700,
  },

  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  editButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCell: {
    padding: "55px 20px",
    textAlign: "center",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    color: "#64748b",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    background: "#f1f5f9",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    width: "100%",
    maxWidth: 720,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 25px 80px rgba(15, 23, 42, 0.3)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #e9eef5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  modalTitle: {
    margin: 0,
    fontSize: 21,
    color: "#172033",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 13,
  },

  closeButton: {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 9,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalBody: {
    padding: 24,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #dbe3ef",
    borderRadius: 9,
    outline: "none",
    fontSize: 14,
    color: "#172033",
    background: "#ffffff",
  },

  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e9eef5",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    padding: "11px 18px",
    background: "#ffffff",
    color: "#475569",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
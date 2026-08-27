import { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Plus,
  UserPlus,
  PackagePlus,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ReceiptText,
} from "lucide-react";

import { customerService } from "../../services/customerService";
import { invoiceService } from "../../services/invoiceService";
import { productService } from "../../services/productService";

type DashboardInvoice = {
  id: number | string;
  invoiceNumber?: string;
  customerName?: string;
  customer?: string;
  amount?: number | string;
  total?: number | string;
  grandTotal?: number | string;
  currency?: string;
  status?: string;
};

export default function Dashboard() {
  const [customerCount, setCustomerCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<
    DashboardInvoice[]
  >([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getAmount = (invoice: DashboardInvoice) => {
    const value =
      invoice.amount ?? invoice.total ?? invoice.grandTotal ?? 0;

    if (typeof value === "number") return value;

    return Number(
      String(value)
        .replace(/[₹,$\s]/g, "")
        .replace(/,/g, "")
    ) || 0;
  };

  const loadDashboardData = () => {
    const customers = customerService.getAll();
    const invoices =
      invoiceService.getAll() as DashboardInvoice[];
    const products = productService.getAll();

    setCustomerCount(customers.length);
    setInvoiceCount(invoices.length);
    setProductCount(products.length);

    const paidInvoices = invoices.filter(
      (invoice) =>
        invoice.status?.toLowerCase() === "paid"
    );

    const pendingInvoices = invoices.filter(
      (invoice) =>
        invoice.status?.toLowerCase() === "pending"
    );

    const overdueInvoices = invoices.filter(
      (invoice) =>
        invoice.status?.toLowerCase() === "overdue"
    );

    const paidRevenue = paidInvoices.reduce(
      (sum, invoice) => sum + getAmount(invoice),
      0
    );

    const outstandingAmount = invoices
      .filter(
        (invoice) =>
          invoice.status?.toLowerCase() !== "paid"
      )
      .reduce(
        (sum, invoice) => sum + getAmount(invoice),
        0
      );

    setRevenue(paidRevenue);
    setOutstanding(outstandingAmount);
    setPaidCount(paidInvoices.length);
    setPendingCount(pendingInvoices.length);
    setOverdueCount(overdueInvoices.length);

    setRecentInvoices(
      [...invoices]
        .reverse()
        .slice(0, 5)
    );
  };

  const formatCurrency = (
  amount: number,
  currencyCode = "INR"
) =>
  new Intl.NumberFormat(
    currencyCode === "INR" ? "en-IN" : undefined,
    {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }
  ).format(amount);

  const totalStatusCount =
    paidCount + pendingCount + overdueCount;

  const getPercentage = (count: number) => {
    if (!totalStatusCount) return 0;

    return Math.round(
      (count / totalStatusCount) * 100
    );
  };

  const getStatusStyle = (status?: string) => {
    const value = status?.toLowerCase();

    if (value === "paid") {
      return {
        background: "#eaf8f1",
        color: "#19764d",
        border: "1px solid #ccebd9",
      };
    }

    if (value === "pending") {
      return {
        background: "#fff7e6",
        color: "#9a6512",
        border: "1px solid #f4dfaf",
      };
    }

    if (value === "overdue") {
      return {
        background: "#fff0f0",
        color: "#b53a3a",
        border: "1px solid #f3d0d0",
      };
    }

    return {
      background: "#eef4fa",
      color: "#536b82",
      border: "1px solid #d9e5ef",
    };
  };

  const currentDate = new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <div style={styles.heroSection}>
        <div>
          <div style={styles.eyebrow}>
            ANAX CLOUD BILLING
          </div>

          <h1 style={styles.pageTitle}>
            Business Dashboard
          </h1>

          <p style={styles.pageSubtitle}>
            Monitor your billing performance, customers and
            business activity in one place.
          </p>
        </div>

        <div style={styles.dateBox}>
          <div style={styles.dateLabel}>
            TODAY
          </div>

          <div style={styles.dateValue}>
            {currentDate}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}

      <div style={styles.kpiGrid}>
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(revenue)}
          icon={<DollarSign size={24} />}
          tint="#edf5ff"
          iconBackground="#dcecff"
          iconColor="#1f5f99"
          subtitle={`${paidCount} paid invoice${
            paidCount === 1 ? "" : "s"
          }`}
        />

        <MetricCard
          title="Customers"
          value={String(customerCount)}
          icon={<Users size={24} />}
          tint="#f2f1ff"
          iconBackground="#e5e3ff"
          iconColor="#6656a8"
          subtitle="Active customer records"
        />

        <MetricCard
          title="Invoices"
          value={String(invoiceCount)}
          icon={<FileText size={24} />}
          tint="#edfaf8"
          iconBackground="#d9f1ed"
          iconColor="#287d72"
          subtitle="Total invoices created"
        />

        <MetricCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          icon={<Clock size={24} />}
          tint="#fff8ed"
          iconBackground="#ffedd0"
          iconColor="#a76b12"
          subtitle={`${pendingCount + overdueCount} invoice${
            pendingCount + overdueCount === 1 ? "" : "s"
          } awaiting payment`}
        />
      </div>

      {/* MAIN GRID */}

      <div style={styles.mainGrid}>
        {/* REVENUE OVERVIEW */}

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitleRow}>
                <div style={styles.panelIcon}>
                  <TrendingUp size={20} />
                </div>

                <div>
                  <h2 style={styles.panelTitle}>
                    Revenue Overview
                  </h2>

                  <p style={styles.panelSubtitle}>
                    Billing performance based on your current
                    invoice data.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.revenueBadge}>
              <ArrowUpRight size={16} />
              Live Data
            </div>
          </div>

          <div style={styles.revenueContent}>
            <div style={styles.revenueMain}>
              <span style={styles.revenueLabel}>
                PAID REVENUE
              </span>

              <div style={styles.revenueValue}>
                {formatCurrency(revenue)}
              </div>

              <div style={styles.revenueHint}>
                Revenue received from invoices marked as paid
              </div>
            </div>

            <div style={styles.visualArea}>
              <div style={styles.chartBars}>
                <div
                  style={{
                    ...styles.bar,
                    height: "36%",
                  }}
                />

                <div
                  style={{
                    ...styles.bar,
                    height: "58%",
                  }}
                />

                <div
                  style={{
                    ...styles.bar,
                    height: "46%",
                  }}
                />

                <div
                  style={{
                    ...styles.bar,
                    height: "76%",
                  }}
                />

                <div
                  style={{
                    ...styles.bar,
                    height: "63%",
                  }}
                />

                <div
                  style={{
                    ...styles.bar,
                    height: "88%",
                  }}
                />
              </div>

              <div style={styles.chartLabels}>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
        </div>

        {/* INVOICE STATUS */}

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitleRow}>
              <div
                style={{
                  ...styles.panelIcon,
                  background: "#f0f4fb",
                  color: "#365d82",
                }}
              >
                <ReceiptText size={20} />
              </div>

              <div>
                <h2 style={styles.panelTitle}>
                  Invoice Status
                </h2>

                <p style={styles.panelSubtitle}>
                  Current payment distribution
                </p>
              </div>
            </div>
          </div>

          <div style={styles.statusList}>
            <StatusRow
              label="Paid"
              count={paidCount}
              percentage={getPercentage(paidCount)}
              color="#2b8a62"
              icon={<CheckCircle2 size={18} />}
            />

            <StatusRow
              label="Pending"
              count={pendingCount}
              percentage={getPercentage(pendingCount)}
              color="#c2861e"
              icon={<Clock size={18} />}
            />

            <StatusRow
              label="Overdue"
              count={overdueCount}
              percentage={getPercentage(overdueCount)}
              color="#c14c4c"
              icon={<AlertCircle size={18} />}
            />
          </div>

          <div style={styles.statusFooter}>
            <span>Total invoices</span>
            <strong>{invoiceCount}</strong>
          </div>
        </div>
      </div>

      {/* LOWER GRID */}

      <div style={styles.lowerGrid}>
        {/* RECENT INVOICES */}

        <div style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Recent Invoices
              </h2>

              <p style={styles.panelSubtitle}>
                Your latest billing activity
              </p>
            </div>

            <div style={styles.viewAll}>
              View invoices
              <ArrowUpRight size={16} />
            </div>
          </div>

          {recentInvoices.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText
                size={34}
                color="#9ab0c4"
              />

              <div>
                <strong>No invoices yet</strong>

                <p>
                  Create your first invoice to start tracking
                  billing activity.
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.invoiceList}>
              {recentInvoices.map((invoice) => {
                const amount = getAmount(invoice);

                return (
                  <div
                    key={String(invoice.id)}
                    style={styles.invoiceRow}
                  >
                    <div style={styles.invoiceLeft}>
                      <div style={styles.invoiceAvatar}>
                        <FileText size={18} />
                      </div>

                      <div>
                        <div style={styles.invoiceNumber}>
                          {invoice.invoiceNumber ??
                            `INV-${invoice.id}`}
                        </div>

                        <div style={styles.customerName}>
                          {invoice.customerName ??
                            invoice.customer ??
                            "Customer"}
                        </div>
                      </div>
                    </div>

                    <div style={styles.invoiceRight}>
                      <div style={styles.invoiceAmount}>
                        {formatCurrency(amount, invoice.currency || "INR")}
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getStatusStyle(
                            invoice.status
                          ),
                        }}
                      >
                        {invoice.status ?? "Draft"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}

        <div style={styles.quickPanel}>
          <div style={styles.quickHeader}>
            <div>
              <div style={styles.quickEyebrow}>
                SHORTCUTS
              </div>

              <h2 style={styles.quickTitle}>
                Quick Actions
              </h2>

              <p style={styles.quickSubtitle}>
                Start common tasks quickly.
              </p>
            </div>
          </div>

          <div style={styles.quickActions}>
            <QuickAction
              icon={<Plus size={19} />}
              title="Create Invoice"
              description="Generate a new customer invoice"
            />

            <QuickAction
              icon={<UserPlus size={19} />}
              title="Add Customer"
              description="Create a new customer record"
            />

            <QuickAction
              icon={<PackagePlus size={19} />}
              title="Add Product"
              description="Add a product or service"
            />
          </div>

          <div style={styles.businessSnapshot}>
            <div>
              <div style={styles.snapshotLabel}>
                BUSINESS SNAPSHOT
              </div>

              <div style={styles.snapshotText}>
                {customerCount} customers · {productCount} products
              </div>
            </div>

            <div style={styles.snapshotIcon}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function MetricCard({
  title,
  value,
  icon,
  tint,
  iconBackground,
  iconColor,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tint: string;
  iconBackground: string;
  iconColor: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        ...styles.metricCard,
        background: `linear-gradient(135deg, ${tint} 0%, #ffffff 72%)`,
      }}
    >
      <div style={styles.metricTop}>
        <div>
          <div style={styles.metricTitle}>{title}</div>
          <div style={styles.metricValue}>{value}</div>
        </div>

        <div
          style={{
            ...styles.metricIcon,
            background: iconBackground,
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={styles.metricSubtitle}>{subtitle}</div>
    </div>
  );
}

function StatusRow({
  label,
  count,
  percentage,
  color,
  icon,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div style={styles.statusRow}>
      <div style={styles.statusTop}>
        <div style={styles.statusLabel}>
          <span style={{ color }}>{icon}</span>
          {label}
        </div>

        <div style={styles.statusCount}>
          {count}
          <span>{percentage}%</span>
        </div>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      style={styles.quickAction}
    >
      <div style={styles.quickActionIcon}>{icon}</div>

      <div style={styles.quickActionText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <ArrowUpRight
        size={17}
        color="#6f879e"
      />
    </button>
  );
}

/* ---------- STYLES ---------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    padding: "34px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #f3f8fd 0%, #f8fbfe 45%, #edf4fa 100%)",
  },

  heroSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    padding: "28px 30px",
    marginBottom: "24px",
    borderRadius: "20px",
    background:
      "linear-gradient(115deg, #eef6fd 0%, #f9fcff 55%, #eaf2f9 100%)",
    border: "1px solid #d9e7f2",
    boxShadow: "0 10px 30px rgba(29, 66, 99, 0.05)",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#5a7b99",
    marginBottom: "8px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 750,
    letterSpacing: "-0.7px",
    color: "#18334d",
  },

  pageSubtitle: {
    margin: "8px 0 0",
    fontSize: "15px",
    color: "#667b90",
  },

  dateBox: {
    minWidth: "190px",
    padding: "14px 17px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.78)",
    border: "1px solid #e0ebf3",
  },

  dateLabel: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    color: "#7690a6",
    marginBottom: "5px",
  },

  dateValue: {
    fontSize: "13px",
    fontWeight: 650,
    color: "#35546f",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  metricCard: {
    minHeight: "152px",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid #dce8f1",
    boxShadow: "0 8px 24px rgba(33, 65, 94, 0.055)",
    boxSizing: "border-box",
  },

  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  metricTitle: {
    fontSize: "14px",
    color: "#60768b",
    fontWeight: 600,
  },

  metricValue: {
    marginTop: "12px",
    fontSize: "29px",
    fontWeight: 750,
    letterSpacing: "-0.7px",
    color: "#18334d",
  },

  metricIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  metricSubtitle: {
    marginTop: "17px",
    paddingTop: "13px",
    borderTop: "1px solid rgba(170, 193, 211, 0.34)",
    fontSize: "12px",
    color: "#8193a4",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 0.85fr)",
    gap: "20px",
    marginBottom: "20px",
  },

  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 0.85fr)",
    gap: "20px",
  },

  panel: {
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,252,255,0.96))",
    border: "1px solid #dce8f1",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 26px rgba(33, 65, 94, 0.05)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  panelTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  panelIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "#e9f3fc",
    color: "#28649b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  panelTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
    letterSpacing: "-0.3px",
    color: "#20394f",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#778b9e",
    lineHeight: 1.5,
  },

  revenueBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "7px 10px",
    borderRadius: "9px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#277150",
    background: "#edf9f3",
    border: "1px solid #d7f0e2",
  },

  revenueContent: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 0.9fr) minmax(280px, 1.1fr)",
    gap: "24px",
    alignItems: "end",
  },

  revenueMain: {
    padding: "20px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, #f0f7fd, #f8fbfe)",
    border: "1px solid #dfebf4",
  },

  revenueLabel: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    color: "#718da7",
  },

  revenueValue: {
    marginTop: "9px",
    fontSize: "30px",
    fontWeight: 750,
    color: "#1c4567",
  },

  revenueHint: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#7d91a3",
    lineHeight: 1.5,
  },

  visualArea: {
    height: "180px",
    padding: "10px 8px 0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  chartBars: {
    height: "145px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    gap: "13px",
    padding: "0 8px",
    borderBottom: "1px solid #dfeaf2",
  },

  bar: {
    flex: 1,
    maxWidth: "42px",
    minWidth: "16px",
    borderRadius: "8px 8px 3px 3px",
    background:
      "linear-gradient(180deg, #4f89bb 0%, #8bb8dc 100%)",
    boxShadow: "0 5px 12px rgba(46, 105, 153, 0.14)",
  },

  chartLabels: {
    display: "flex",
    justifyContent: "space-around",
    paddingTop: "10px",
    fontSize: "10px",
    color: "#8a9baa",
  },

  statusList: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    paddingTop: "5px",
  },

  statusRow: {},

  statusTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "9px",
  },

  statusLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 650,
    color: "#435b70",
  },

  statusCount: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
    fontWeight: 750,
    color: "#263f55",
  },

  progressTrack: {
    width: "100%",
    height: "7px",
    borderRadius: "999px",
    background: "#edf2f6",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },

  statusFooter: {
    marginTop: "26px",
    paddingTop: "17px",
    borderTop: "1px solid #e6eef4",
    display: "flex",
    justifyContent: "space-between",
    color: "#718597",
    fontSize: "13px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  viewAll: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#326a9b",
    cursor: "pointer",
  },

  invoiceList: {
    display: "flex",
    flexDirection: "column",
  },

  invoiceRow: {
    padding: "15px 0",
    borderBottom: "1px solid #edf2f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  invoiceLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  invoiceAvatar: {
    width: "39px",
    height: "39px",
    flexShrink: 0,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3d6f99",
    background: "#edf5fb",
  },

  invoiceNumber: {
    fontSize: "14px",
    fontWeight: 750,
    color: "#294359",
  },

  customerName: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#8293a2",
  },

  invoiceRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },

  invoiceAmount: {
    fontSize: "14px",
    fontWeight: 750,
    color: "#294359",
  },

  statusBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 750,
    textTransform: "capitalize",
  },

  emptyState: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "12px",
    color: "#698095",
  },

  quickPanel: {
    borderRadius: "20px",
    padding: "24px",
    background:
      "linear-gradient(145deg, #eff7fd 0%, #f9fcff 55%, #edf4fa 100%)",
    border: "1px solid #d7e5ef",
    boxShadow: "0 8px 26px rgba(33, 65, 94, 0.05)",
  },

  quickHeader: {
    marginBottom: "18px",
  },

  quickEyebrow: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.4px",
    color: "#7290a9",
    marginBottom: "6px",
  },

  quickTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 750,
    color: "#20394f",
  },

  quickSubtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#788d9f",
  },

  quickActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  quickAction: {
    width: "100%",
    padding: "13px",
    border: "1px solid #dbe7f0",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.78)",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    textAlign: "left",
    cursor: "pointer",
  },

  quickActionIcon: {
    width: "37px",
    height: "37px",
    flexShrink: 0,
    borderRadius: "11px",
    background: "#e3f0fa",
    color: "#326c9c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    color: "#294359",
  },

  businessSnapshot: {
    marginTop: "18px",
    padding: "15px",
    borderRadius: "14px",
    background: "rgba(219, 237, 249, 0.62)",
    border: "1px solid #d2e3ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  snapshotLabel: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.1px",
    color: "#7892a8",
  },

  snapshotText: {
    marginTop: "5px",
    fontSize: "13px",
    fontWeight: 650,
    color: "#36556f",
  },

  snapshotIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#3974a5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
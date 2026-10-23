import type { Invoice } from "../../types/invoice";

export type SmartInvoiceStatus =
  | "Draft"
  | "Sent"
  | "Pending"
  | "Due Today"
  | "Overdue"
  | "Paid"
  | "Cancelled";

export function getSmartInvoiceStatus(invoice: Invoice): SmartInvoiceStatus {
  if (invoice.status === "Paid") return "Paid";
  if (invoice.status === "Draft") return "Draft";
  if (invoice.status === "Cancelled") return "Cancelled";

  if (!invoice.dueDate) {
    return invoice.status === "Sent" ? "Sent" : "Pending";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${invoice.dueDate}T00:00:00`);

  if (dueDate < today) return "Overdue";
  if (dueDate.getTime() === today.getTime()) return "Due Today";
  return "Pending";
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  AED: "د.إ",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatCurrency(
  value: number,
  currencyCode: string = "INR"
): string {
  const symbol = currencySymbols[currencyCode] || currencyCode;
  const formatted = Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function statusBadgeStyle(status: SmartInvoiceStatus): {
  background: string;
  color: string;
  border: string;
} {
  switch (status) {
    case "Paid":
      return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    case "Sent":
      return { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
    case "Pending":
      return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    case "Due Today":
      return { background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" };
    case "Overdue":
      return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
    case "Cancelled":
      return { background: "#e5e7eb", color: "#4b5563", border: "1px solid #d1d5db" };
    case "Draft":
    default:
      return { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
  }
}

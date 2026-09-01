import { useMemo } from "react";
import { invoiceService } from "../../services/invoiceService";
import type { Invoice } from "../../types/invoice";

const formatCurrency = (
  value: number,
  currency: string
) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const getSmartStatus = (invoice: Invoice) => {
  if (invoice.status === "Paid") {
    return "Paid";
  }

  if (invoice.status === "Draft") {
    return "Draft";
  }

  if (invoice.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return "Overdue";
    }
  }

  return invoice.status;
};

export default function Reports() {
  const invoices = useMemo(
    () => invoiceService.getAll(),
    []
  );

  const reportData = useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const paidByCurrency: Record<string, number> = {};
    const outstandingByCurrency: Record<string, number> = {};

    let paidCount = 0;
    let overdueCount = 0;
    let sentCount = 0;
    let draftCount = 0;

    invoices.forEach((invoice) => {
      const currency = invoice.currency;
      const status = getSmartStatus(invoice);

      totalsByCurrency[currency] =
        (totalsByCurrency[currency] || 0) +
        invoice.amount;

      if (status === "Paid") {
        paidCount++;

        paidByCurrency[currency] =
          (paidByCurrency[currency] || 0) +
          invoice.amount;
      }

      if (
        status === "Sent" ||
        status === "Overdue"
      ) {
        outstandingByCurrency[currency] =
          (outstandingByCurrency[currency] || 0) +
          invoice.amount;
      }

      if (status === "Overdue") overdueCount++;
      if (status === "Sent") sentCount++;
      if (status === "Draft") draftCount++;
    });

    return {
      totalsByCurrency,
      paidByCurrency,
      outstandingByCurrency,
      paidCount,
      overdueCount,
      sentCount,
      draftCount,
    };
  }, [invoices]);

  const totalInvoiced = Object.entries(
    reportData.totalsByCurrency
  );

  const totalPaid = Object.entries(
    reportData.paidByCurrency
  );

  const totalOutstanding = Object.entries(
    reportData.outstandingByCurrency
  );

  const statusCards = [
    {
      title: "Paid",
      value: reportData.paidCount,
      color: "#059669",
    },
    {
      title: "Sent",
      value: reportData.sentCount,
      color: "#2563eb",
    },
    {
      title: "Overdue",
      value: reportData.overdueCount,
      color: "#dc2626",
    },
    {
      title: "Draft",
      value: reportData.draftCount,
      color: "#6b7280",
    },
  ];

  return (
    <div
      style={{
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100%",
      }}
    >
      {/* HEADER */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            color: "#111827",
          }}
        >
          Reports
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#6b7280",
          }}
        >
          Overview of your billing and invoice performance.
        </p>
      </div>

      {/* FINANCIAL SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "22px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            Total Invoiced
          </div>

          {totalInvoiced.length > 0 ? (
            totalInvoiced.map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "4px",
                  }}
                >
                  {formatCurrency(
                    amount,
                    currency
                  )}
                </div>
              )
            )
          ) : (
            <strong>No invoices</strong>
          )}
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "22px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            Total Paid
          </div>

          {totalPaid.length > 0 ? (
            totalPaid.map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#059669",
                    marginBottom: "4px",
                  }}
                >
                  {formatCurrency(
                    amount,
                    currency
                  )}
                </div>
              )
            )
          ) : (
            <strong>₹0.00</strong>
          )}
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "22px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            Outstanding
          </div>

          {totalOutstanding.length > 0 ? (
            totalOutstanding.map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#dc2626",
                    marginBottom: "4px",
                  }}
                >
                  {formatCurrency(
                    amount,
                    currency
                  )}
                </div>
              )
            )
          ) : (
            <strong>₹0.00</strong>
          )}
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "22px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            Total Invoices
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {invoices.length}
          </div>
        </div>
      </div>

      {/* STATUS SUMMARY */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "20px",
          }}
        >
          Invoice Status Summary
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {statusCards.map((card) => (
            <div
              key={card.title}
              style={{
                border:
                  "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: card.color,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CURRENCY BREAKDOWN */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "20px",
          }}
        >
          Revenue by Currency
        </h2>

        {totalInvoiced.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
            }}
          >
            No invoice data available.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {totalInvoiced.map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    padding: "16px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                  }}
                >
                  <strong>{currency}</strong>

                  <strong>
                    {formatCurrency(
                      amount,
                      currency
                    )}
                  </strong>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
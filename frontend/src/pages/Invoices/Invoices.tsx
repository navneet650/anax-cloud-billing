export default function Invoices() {
  return (
    <div
      style={{
        padding: 60,
        textAlign: "center",
        color: "#374151",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#111827",
          margin: "0 0 12px",
        }}
      >
        Invoices
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          maxWidth: 500,
          margin: "0 auto 24px",
          lineHeight: 1.6,
        }}
      >
        The Invoices page is being upgraded to cloud storage.
        It will be available shortly with server-side PDF generation
        and email delivery.
      </p>
      <div
        style={{
          display: "inline-block",
          padding: "10px 20px",
          borderRadius: 8,
          background: "#eff6ff",
          color: "#2563eb",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        🚧 Coming soon
      </div>
    </div>
  );
}

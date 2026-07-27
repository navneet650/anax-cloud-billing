export default function Dashboard() {
  const cards = [
    {
      title: "Revenue",
      value: "$12,450",
    },
    {
      title: "Customers",
      value: "128",
    },
    {
      title: "Invoices",
      value: "46",
    },
    {
      title: "Outstanding",
      value: "$2,980",
    },
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h1>Dashboard</h1>

      <p>Welcome to Anax Cloud Billing.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,.08)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: "14px",
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "28px",
                fontWeight: "bold",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "40px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "25px",
            minHeight: "300px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          }}
        >
          <h2>Revenue Overview</h2>

          <div
            style={{
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
            }}
          >
            Chart coming soon...
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "25px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          }}
        >
          <h2>Recent Invoices</h2>

          <ul>
            <li>INV-1001</li>
            <li>INV-1002</li>
            <li>INV-1003</li>
            <li>INV-1004</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
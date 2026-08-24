import type { ReactNode } from "react"; 
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";
type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  const { user, logout } = useAuth();
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f4f7fb",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          background: "#1f2937",
          color: "white",
          padding: "24px",
        }}
      >
        <h2
  style={{
    color: "#ffffff",
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.2,
  }}
>
  Anax Cloud Billing
</h2>

        <hr style={{ margin: "20px 0", opacity: 0.3 }} />

       <div style={{ marginTop: "20px" }}>
  <NavLink
    to="/"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <LayoutDashboard size={18} />
    Dashboard
  </NavLink>

  <NavLink
    to="/customers"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <Users size={18} />
    Customers
  </NavLink>

  <NavLink
    to="/products"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <Package size={18} />
    Products
  </NavLink>

  <NavLink
    to="/invoices"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <FileText size={18} />
    Invoices
  </NavLink>

  <NavLink
    to="/reports"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <BarChart3 size={18} />
    Reports
  </NavLink>

  <NavLink
    to="/settings"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "white",
      textDecoration: "none",
      marginBottom: "18px",
    }}
  >
    <Settings size={18} />
    Settings
  </NavLink>
</div>
      </div>

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "70px",
            background: "white",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 30px",
          }}
        >
          <h3>Dashboard</h3>

          <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
  }}
>
  <span>👤 {user}</span>

  <button
    onClick={logout}
    style={{
      background: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "8px 14px",
      cursor: "pointer",
    }}
  >
    Logout
  </button>
</div>
        </div>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
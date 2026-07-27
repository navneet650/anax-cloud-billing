import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import AppLayout from "./layouts/AppLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Products from "./pages/Products/Products";
import Invoices from "./pages/Invoices/Invoices";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";

import { login } from "./services/auth/auth";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  if (!user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f7fb",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 5px 20px rgba(0,0,0,.1)",
            textAlign: "center",
          }}
        >
          <h1>Anax Cloud Billing</h1>

          <p>Cloud Native GST Billing Platform</p>

          <button
            onClick={login}
            style={{
              padding: "12px 24px",
              background: "#FF9900",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Sign in with Amazon Cognito
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
import { login } from "./services/auth/auth";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "100px" }}>Loading...</h2>;
  }

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
          boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
          minWidth: "420px",
        }}
      >
        <h1>Anax Cloud Billing</h1>

        <p>Cloud Native GST Billing Platform</p>

        {user ? (
          <>
            <h3>Welcome!</h3>

            <p>
              <strong>{user}</strong>
            </p>

            <button
              onClick={logout}
              style={{
                padding: "12px 24px",
                background: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default App;
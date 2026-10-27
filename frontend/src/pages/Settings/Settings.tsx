import { useState, useEffect } from "react";
import {
  settingsService,
  type BusinessSettings,
} from "../../services/settingsService";

const currencies = [
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
];

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .get()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load settings";
        setLoadError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof BusinessSettings>(
    field: K,
    value: BusinessSettings[K]
  ) => {
    setSettings((current) =>
      current ? { ...current, [field]: value } : current
    );
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await settingsService.save(settings);
      setSettings(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Reset all settings to their default values?"
    );

    if (!confirmed) return;

    setSaving(true);
    setSaveError(null);
    try {
      const defaults = await settingsService.reset();
      setSettings(defaults);
      setSaved(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reset settings";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    background: "#ffffff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "6px",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: "18px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    marginBottom: "22px",
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#6b7280",
          fontSize: 16,
        }}
      >
        Loading settings...
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#dc2626",
          fontSize: 16,
        }}
      >
        {loadError || "Failed to load settings"}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        paddingBottom: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              color: "#111827",
            }}
          >
            Settings
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Manage your business and invoice preferences.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {saved && (
            <span
              style={{
                color: "#059669",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Settings saved
            </span>
          )}

          {saveError && (
            <span
              style={{
                color: "#dc2626",
                fontSize: "14px",
                fontWeight: 600,
                maxWidth: "320px",
              }}
            >
              {saveError}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              border: "none",
              background: saving ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              padding: "11px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "20px",
            color: "#111827",
          }}
        >
          Business Profile
        </h2>

        <p
          style={{
            margin: "0 0 24px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Information used for your business identity and invoices.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "0 22px",
          }}
        >
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Business Name
            </label>
            <input
              style={inputStyle}
              value={settings.businessName}
              onChange={(e) =>
                updateField(
                  "businessName",
                  e.target.value
                )
              }
              placeholder="Business name"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Legal Name
            </label>
            <input
              style={inputStyle}
              value={settings.legalName}
              onChange={(e) =>
                updateField(
                  "legalName",
                  e.target.value
                )
              }
              placeholder="Legal business name"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Email
            </label>
            <input
              type="email"
              style={inputStyle}
              value={settings.email}
              onChange={(e) =>
                updateField(
                  "email",
                  e.target.value
                )
              }
              placeholder="billing@example.com"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Phone
            </label>
            <input
              style={inputStyle}
              value={settings.phone}
              onChange={(e) =>
                updateField(
                  "phone",
                  e.target.value
                )
              }
              placeholder="Business phone"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              GSTIN
            </label>
            <input
              style={inputStyle}
              value={settings.gstin}
              onChange={(e) =>
                updateField(
                  "gstin",
                  e.target.value.toUpperCase()
                )
              }
              placeholder="GSTIN"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              PAN
            </label>
            <input
              style={inputStyle}
              value={settings.pan}
              onChange={(e) =>
                updateField(
                  "pan",
                  e.target.value.toUpperCase()
                )
              }
              placeholder="PAN"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Website
            </label>
            <input
              type="url"
              style={inputStyle}
              value={settings.website}
              onChange={(e) =>
                updateField(
                  "website",
                  e.target.value
                )
              }
              placeholder="https://example.com"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              PIN Code
            </label>
            <input
              style={inputStyle}
              value={settings.pincode}
              onChange={(e) =>
                updateField(
                  "pincode",
                  e.target.value
                )
              }
              placeholder="PIN / ZIP code"
            />
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Address
          </label>
          <input
            style={inputStyle}
            value={settings.address}
            onChange={(e) =>
              updateField(
                "address",
                e.target.value
              )
            }
            placeholder="Business address"
          />
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              color: "#111827",
            }}
          >
            Bank Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "0 22px",
            }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Bank Name
              </label>
              <input
                style={inputStyle}
                value={settings.bankName}
                onChange={(e) =>
                  updateField(
                    "bankName",
                    e.target.value
                  )
                }
                placeholder="Bank name"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>
                Branch
              </label>
              <input
                style={inputStyle}
                value={settings.bankBranch}
                onChange={(e) =>
                  updateField(
                    "bankBranch",
                    e.target.value
                  )
                }
                placeholder="Bank branch"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>
                Account Number
              </label>
              <input
                style={inputStyle}
                value={settings.accountNumber}
                onChange={(e) =>
                  updateField(
                    "accountNumber",
                    e.target.value
                  )
                }
                placeholder="Bank account number"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>
                IFSC
              </label>
              <input
                style={inputStyle}
                value={settings.ifsc}
                onChange={(e) =>
                  updateField(
                    "ifsc",
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="IFSC code"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "16px",
              color: "#111827",
            }}
          >
            Invoice Logo
          </h3>

          <p
            style={{
              margin: "0 0 16px",
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            Logo displayed on your invoices.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (!file) {
                return;
              }

              if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be smaller than 2 MB.");
                e.target.value = "";
                return;
              }

              const reader = new FileReader();

              reader.onload = () => {
                updateField(
                  "logo",
                  String(reader.result ?? "")
                );
              };

              reader.readAsDataURL(file);
            }}
          />

          {settings.logo && (
            <div style={{ marginTop: "16px" }}>
              <img
                src={settings.logo}
                alt="Invoice logo"
                style={{
                  maxWidth: "180px",
                  maxHeight: "80px",
                  objectFit: "contain",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "8px",
                }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "16px",
              color: "#111827",
            }}
          >
            Terms & Conditions
          </h3>

          <p
            style={{
              margin: "0 0 16px",
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            These terms will appear on your invoices.
          </p>

          <textarea
            style={{
              ...inputStyle,
              minHeight: "150px",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            value={settings.termsAndConditions}
            onChange={(e) =>
              updateField(
                "termsAndConditions",
                e.target.value
              )
            }
            placeholder={
              "Enter one term per line.\n" +
              "Example: Payment is due within the agreed credit period."
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "0 22px",
          }}
        >
          <div style={fieldStyle}>
            <label style={labelStyle}>
              City
            </label>
            <input
              style={inputStyle}
              value={settings.city}
              onChange={(e) =>
                updateField(
                  "city",
                  e.target.value
                )
              }
              placeholder="City"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              State
            </label>
            <input
              style={inputStyle}
              value={settings.state}
              onChange={(e) =>
                updateField(
                  "state",
                  e.target.value
                )
              }
              placeholder="State"
            />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "20px",
            color: "#111827",
          }}
        >
          Invoice Defaults
        </h2>

        <p
          style={{
            margin: "0 0 24px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Default values used when creating new invoices.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "0 22px",
          }}
        >
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Default Currency
            </label>

            <select
              style={inputStyle}
              value={settings.defaultCurrency}
              onChange={(e) =>
                updateField(
                  "defaultCurrency",
                  e.target.value as BusinessSettings["defaultCurrency"]
                )
              }
            >
              {currencies.map((currency) => (
                <option
                  key={currency.code}
                  value={currency.code}
                >
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Payment Terms (Days)
            </label>

            <input
              type="number"
              min="0"
              style={inputStyle}
              value={settings.paymentTerms}
              onChange={(e) =>
                updateField(
                  "paymentTerms",
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Default Tax Rate (%)
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              style={inputStyle}
              value={settings.defaultTaxRate}
              onChange={(e) =>
                updateField(
                  "defaultTaxRate",
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Invoice Prefix
            </label>

            <input
              style={inputStyle}
              value={settings.invoicePrefix}
              onChange={(e) =>
                updateField(
                  "invoicePrefix",
                  e.target.value
                )
              }
              placeholder="INV-"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Next Invoice Number
            </label>

            <input
              type="number"
              style={inputStyle}
              value={settings.startingInvoiceNumber || ""}
              onChange={(e) =>
                updateField(
                  "startingInvoiceNumber",
                  Number(e.target.value)
                )
              }
              placeholder="e.g. 16"
            />
            <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
              If you have existing invoices, set this to your next number. Otherwise, leave it at 1.
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                Signature Required on Invoice
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: 1.5,
                }}
              >
                When OFF: PDFs show "computer generated, no signature required" footer.
                When ON: PDFs show a signature block for the authorised signatory instead.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateField("signatureRequired", !settings.signatureRequired)
              }
              style={{
                flexShrink: 0,
                width: 52,
                height: 30,
                borderRadius: 999,
                border: "none",
                background: settings.signatureRequired ? "#2563eb" : "#d1d5db",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
              }}
              aria-pressed={settings.signatureRequired}
              title={
                settings.signatureRequired
                  ? "Signature mode ON — click to turn off"
                  : "Computer-generated mode — click to turn on signature"
              }
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: settings.signatureRequired ? 25 : 3,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: settings.signatureRequired ? "#eff6ff" : "#f9fafb",
              borderRadius: 6,
              fontSize: "12px",
              color: settings.signatureRequired ? "#1e40af" : "#6b7280",
              display: "inline-block",
            }}
          >
            Current mode:{" "}
            <b>
              {settings.signatureRequired
                ? "Signature block on PDF"
                : "Computer generated (no signature)"}
            </b>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          style={{
            border: "1px solid #fecaca",
            background: "#ffffff",
            color: "#dc2626",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          Reset Settings
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
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
  const [settings, setSettings] =
    useState<BusinessSettings>(() =>
      settingsService.get()
    );

  const [saved, setSaved] = useState(false);

  const updateField = <K extends keyof BusinessSettings>(
    field: K,
    value: BusinessSettings[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    settingsService.save(settings);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all settings to their default values?"
    );

    if (!confirmed) {
      return;
    }

    settingsService.reset();

    const defaults = settingsService.get();

    setSettings(defaults);
    setSaved(false);
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

  return (
    <div
      style={{
        minHeight: "100%",
        paddingBottom: "40px",
      }}
    >
      {/* HEADER */}
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

          <button
            type="button"
            onClick={handleSave}
            style={{
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              padding: "11px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* BUSINESS PROFILE */}
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
                {/* BANK DETAILS */}
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
                {/* INVOICE LOGO */}
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
                {/* TERMS & CONDITIONS */}
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

      {/* INVOICE SETTINGS */}
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
        </div>
      </div>

      {/* RESET */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={handleReset}
          style={{
            border: "1px solid #fecaca",
            background: "#ffffff",
            color: "#dc2626",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset Settings
        </button>
      </div>
    </div>
  );
}
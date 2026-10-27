import { getCompanyId } from "../common/auth.mjs";
import { putItem, getItem, updateItem, TABLES } from "../common/db.mjs";
import { ok, badRequest, handleError } from "../common/response.mjs";

export async function handler(event) {
  try {
    const { companyId, email } = getCompanyId(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath.replace(/^\/[^/]+/, "") || "/";

    if (method === "OPTIONS") {
      return ok({});
    }

    if (method === "GET" && path === "/settings") {
      const settings = await getItem(TABLES.SETTINGS, { companyId });
      if (!settings) {
        return ok({
          companyId,
          businessName: "",
          legalName: "",
          email: email || "",
          phone: "",
          gstin: "",
          pan: "",
          website: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          bankName: "",
          bankBranch: "",
          accountNumber: "",
          ifsc: "",
          logoUrl: "",
          defaultCurrency: "INR",
          paymentTerms: 30,
          defaultTaxRate: 18,
          invoicePrefix: "INV-",
          termsAndConditions: "",
          createdAt: null,
          updatedAt: null,
        });
      }
      return ok(settings);
    }

    if (method === "PUT" && path === "/settings") {
      const body = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();

      const allowed = [
        "businessName", "legalName", "email", "phone", "gstin", "pan",
        "website", "address", "city", "state", "pincode",
        "bankName", "bankBranch", "accountNumber", "ifsc", "logoUrl",
        "defaultCurrency", "paymentTerms", "defaultTaxRate",
        "invoicePrefix", "termsAndConditions", "signatureRequired", "startingInvoiceNumber",
      ];

      const updates = {};
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }
      updates.updatedAt = now;

      const existing = await getItem(TABLES.SETTINGS, { companyId });

      let result;
      if (existing) {
        result = await updateItem(TABLES.SETTINGS, { companyId }, updates);
      } else {
        result = await putItem(TABLES.SETTINGS, {
          companyId,
          ...updates,
          createdAt: now,
        });
      }

      return ok(result);
    }

    return badRequest(`Unsupported ${method} ${path}`);
  } catch (err) {
    return handleError(err);
  }
}

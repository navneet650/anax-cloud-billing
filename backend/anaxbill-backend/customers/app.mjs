import { getCompanyId } from "../common/auth.mjs";
import { putItem, getItem, queryByCompany, updateItem, deleteItem, TABLES } from "../common/db.mjs";
import { ok, created, badRequest, notFound, handleError } from "../common/response.mjs";

export async function handler(event) {
  try {
    const { companyId } = getCompanyId(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath.replace(/^\/[^/]+/, "") || "/";

    if (method === "OPTIONS") return ok({});

    const pathParts = path.split("/").filter(Boolean);
    const id = pathParts.length === 2 ? pathParts[1] : null;

    if (method === "GET" && path === "/customers") {
      const items = await queryByCompany(TABLES.CUSTOMERS, companyId);
      return ok({ items, count: items.length });
    }

    if (method === "POST" && path === "/customers") {
      const body = JSON.parse(event.body || "{}");
      if (!body.companyName || !body.companyName.trim()) {
        return badRequest("companyName is required");
      }
      const now = new Date().toISOString();
      const customerId = body.id || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item = {
        companyId,
        customerId,
        companyName: body.companyName.trim(),
        contactPerson: body.contactPerson || "",
        gstin: body.gstin || "",
        pan: body.pan || "",
        email: body.email || "",
        mobile: body.mobile || "",
        addressLine1: body.addressLine1 || "",
        addressLine2: body.addressLine2 || "",
        city: body.city || "",
        state: body.state || "",
        pincode: body.pincode || "",
        country: body.country || "India",
        customerType: body.customerType || "Business",
        paymentTerms: body.paymentTerms ?? 30,
        creditLimit: body.creditLimit ?? 0,
        gstRegistered: Boolean(body.gstin),
        isActive: body.isActive !== false,
        notes: body.notes || "",
        createdAt: now,
        updatedAt: now,
      };
      await putItem(TABLES.CUSTOMERS, item);
      return created(item);
    }

    if (method === "GET" && id) {
      const item = await getItem(TABLES.CUSTOMERS, { companyId, customerId: id });
      if (!item) return notFound("Customer not found");
      return ok(item);
    }

    if (method === "PUT" && id) {
      const body = JSON.parse(event.body || "{}");
      const allowed = ["companyName", "contactPerson", "gstin", "pan", "email", "mobile",
        "addressLine1", "addressLine2", "city", "state", "pincode", "country",
        "customerType", "paymentTerms", "creditLimit", "gstRegistered", "isActive", "notes"];
      const updates = {};
      for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
      updates.updatedAt = new Date().toISOString();
      const item = await updateItem(TABLES.CUSTOMERS, { companyId, customerId: id }, updates);
      if (!item) return notFound("Customer not found");
      return ok(item);
    }

    if (method === "DELETE" && id) {
      const item = await getItem(TABLES.CUSTOMERS, { companyId, customerId: id });
      if (!item) return notFound("Customer not found");
      await deleteItem(TABLES.CUSTOMERS, { companyId, customerId: id });
      return ok({ deleted: true, customerId: id });
    }

    return badRequest(`Unsupported ${method} ${path}`);
  } catch (err) {
    return handleError(err);
  }
}

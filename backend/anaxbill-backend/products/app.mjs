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

    if (method === "GET" && path === "/products") {
      const items = await queryByCompany(TABLES.PRODUCTS, companyId);
      return ok({ items, count: items.length });
    }

    if (method === "POST" && path === "/products") {
      const body = JSON.parse(event.body || "{}");
      if (!body.name || !body.name.trim()) return badRequest("name is required");
      const now = new Date().toISOString();
      const productId = body.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item = {
        companyId,
        productId,
        name: body.name.trim(),
        sku: body.sku || "",
        description: body.description || "",
        type: body.type || "Service",
        unit: body.unit || "Hour",
        unitPrice: Number(body.unitPrice) || 0,
        currency: body.currency || "INR",
        taxRate: body.taxRate ?? 18,
        hsnSac: body.hsnSac || "",
        isActive: body.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      await putItem(TABLES.PRODUCTS, item);
      return created(item);
    }

    if (method === "GET" && id) {
      const item = await getItem(TABLES.PRODUCTS, { companyId, productId: id });
      if (!item) return notFound("Product not found");
      return ok(item);
    }

    if (method === "PUT" && id) {
      const body = JSON.parse(event.body || "{}");
      const allowed = ["name", "sku", "description", "type", "unit", "unitPrice",
        "currency", "taxRate", "hsnSac", "isActive"];
      const updates = {};
      for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
      if (updates.unitPrice !== undefined) updates.unitPrice = Number(updates.unitPrice);
      if (updates.taxRate !== undefined) updates.taxRate = Number(updates.taxRate);
      updates.updatedAt = new Date().toISOString();
      const item = await updateItem(TABLES.PRODUCTS, { companyId, productId: id }, updates);
      if (!item) return notFound("Product not found");
      return ok(item);
    }

    if (method === "DELETE" && id) {
      const item = await getItem(TABLES.PRODUCTS, { companyId, productId: id });
      if (!item) return notFound("Product not found");
      await deleteItem(TABLES.PRODUCTS, { companyId, productId: id });
      return ok({ deleted: true, productId: id });
    }

    return badRequest(`Unsupported ${method} ${path}`);
  } catch (err) {
    return handleError(err);
  }
}

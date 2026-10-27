import { getCompanyId } from "../common/auth.mjs";
import { putItem, getItem, queryByCompany, updateItem, deleteItem, TABLES } from "../common/db.mjs";
import { ok, created, badRequest, notFound, handleError } from "../common/response.mjs";
import { computeTax, round2 } from "../common/gst.mjs";
import { nextInvoiceNumber } from "../common/numbering.mjs";

export async function handler(event) {
  try {
    const { companyId } = getCompanyId(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath.replace(/^\/[^/]+/, "") || "/";

    if (method === "OPTIONS") return ok({});

    const pathParts = path.split("/").filter(Boolean);
    const id = pathParts.length >= 2 ? pathParts[1] : null;
    const subresource = pathParts.length === 3 ? pathParts[2] : null;

    if (method === "GET" && path === "/invoices") {
      const items = await queryByCompany(TABLES.INVOICES, companyId);
      items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      return ok({ items, count: items.length });
    }

    if (method === "POST" && path === "/invoices") {
      const body = JSON.parse(event.body || "{}");

      if (!body.customerName) return badRequest("customerName is required");
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return badRequest("at least one invoice item is required");
      }

      const settings = await getItem(TABLES.SETTINGS, { companyId });
      const prefix = body.invoiceNumber || settings?.invoicePrefix || "INV-";
      const invoiceNumber = body.invoiceNumber || await nextInvoiceNumber(companyId, prefix, settings?.startingInvoiceNumber || 1);

      const items = body.items.map((it, i) => ({
        id: i + 1,
        productId: it.productId || null,
        description: it.description || "",
        hsnSac: it.hsnSac || "",
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate) || 0,
      }));

      const tax = computeTax(
        items,
        settings?.gstin || "",
        body.customerGstin || "",
        body.placeOfSupply || ""
      );

      const now = new Date().toISOString();
      const invoiceId = body.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const item = {
        companyId,
        invoiceId,
        invoiceNumber,
        customerId: body.customerId || null,
        customerName: body.customerName,
        customerGstin: body.customerGstin || "",
        customerEmail: body.customerEmail || "",
        date: body.date || now.slice(0, 10),
        dueDate: body.dueDate || "",
        poNumber: body.poNumber || "",
        placeOfSupply: body.placeOfSupply || "",
        invoiceDescription: body.invoiceDescription || "",
        notes: body.notes || "",
        currency: body.currency || "INR",
        items,
        subtotal: tax.subtotal,
        taxTotal: tax.taxTotal,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        isIntraState: tax.isIntraState,
        grandTotal: tax.grandTotal,
        status: body.status || "Draft",
        createdAt: now,
        updatedAt: now,
      };

      await putItem(TABLES.INVOICES, item);
      return created(item);
    }

    if (method === "GET" && id && !subresource) {
      const item = await getItem(TABLES.INVOICES, { companyId, invoiceId: id });
      if (!item) return notFound("Invoice not found");
      return ok(item);
    }

    if (method === "PUT" && id && !subresource) {
      const body = JSON.parse(event.body || "{}");
      const updates = {};
      const passThrough = ["customerName", "customerGstin", "customerEmail", "date",
        "dueDate", "poNumber", "placeOfSupply", "invoiceDescription", "notes",
        "currency", "status"];
      for (const k of passThrough) if (body[k] !== undefined) updates[k] = body[k];

      if (Array.isArray(body.items)) {
        const items = body.items.map((it, i) => ({
          id: i + 1,
          productId: it.productId || null,
          description: it.description || "",
          hsnSac: it.hsnSac || "",
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0,
        }));
        const settings = await getItem(TABLES.SETTINGS, { companyId });
        const tax = computeTax(items,
          settings?.gstin || "",
          updates.customerGstin || body.customerGstin || "",
          updates.placeOfSupply || body.placeOfSupply || "");
        updates.items = items;
        updates.subtotal = tax.subtotal;
        updates.taxTotal = tax.taxTotal;
        updates.cgst = tax.cgst;
        updates.sgst = tax.sgst;
        updates.igst = tax.igst;
        updates.isIntraState = tax.isIntraState;
        updates.grandTotal = tax.grandTotal;
      }

      updates.updatedAt = new Date().toISOString();
      const item = await updateItem(TABLES.INVOICES, { companyId, invoiceId: id }, updates);
      if (!item) return notFound("Invoice not found");
      return ok(item);
    }

    if (method === "PUT" && id && subresource === "status") {
      const body = JSON.parse(event.body || "{}");
      const status = body.status;
      const valid = ["Draft", "Sent", "Paid", "Pending", "Overdue", "Cancelled"];
      if (!valid.includes(status)) return badRequest("Invalid status");
      const item = await updateItem(TABLES.INVOICES, { companyId, invoiceId: id }, {
        status,
        updatedAt: new Date().toISOString(),
      });
      if (!item) return notFound("Invoice not found");
      return ok(item);
    }

    if (method === "DELETE" && id && !subresource) {
      const item = await getItem(TABLES.INVOICES, { companyId, invoiceId: id });
      if (!item) return notFound("Invoice not found");
      await deleteItem(TABLES.INVOICES, { companyId, invoiceId: id });
      return ok({ deleted: true, invoiceId: id });
    }

    return badRequest(`Unsupported ${method} ${path}`);
  } catch (err) {
    return handleError(err);
  }
}

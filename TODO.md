# AnaxBill — Roadmap & Notes

_Last updated: 2026-10-16_

## In progress

### Phase 3 — Frontend rewire (localStorage → AWS API)

- [x] **3.1** — Settings page reads/writes from AWS API
- [ ] **3.2** — Customers page → API
- [ ] **3.3** — Products page → API
- [ ] **3.4** — Invoices page → API + PDF download + Send email
- [ ] **3.5** — Delete localStorage services, add `.env.example`, deploy to Amplify

## Planned — future features

### Purchase Orders (PO)

**Why easy:** reuses `common/pdf.mjs`, `common/gst.mjs`, `common/db.mjs`, and the
`api/client.ts` frontend layer. Only the entity names and one HTML template differ.

**Estimated effort:** ~2–3 days of focused work.

**Files to add:**

Backend:
- `AnaxBill_Vendors` DynamoDB table (companyId + vendorId)
- `AnaxBill_POs` DynamoDB table (companyId + poId)
- `backend/anaxbill-backend/vendors/app.mjs` — clone of `customers/app.mjs`
- `backend/anaxbill-backend/pos/app.mjs` — clone of `invoices/app.mjs`, with PO statuses:
  Draft / Sent to Vendor / Received / Closed / Cancelled
- `backend/anaxbill-backend/pos-pdf/app.mjs` — reuses `common/pdf.mjs`
- `backend/anaxbill-backend/pdf/template-po.html` — PO layout
  (title "PURCHASE ORDER", buyer = you, seller = vendor)

Frontend:
- `frontend/src/types/vendor.ts`
- `frontend/src/types/purchaseOrder.ts`
- `frontend/src/services/vendorService.ts`
- `frontend/src/services/poService.ts`
- `frontend/src/pages/Vendors/Vendors.tsx`
- `frontend/src/pages/PurchaseOrders/PurchaseOrders.tsx`
- Update `AppLayout.tsx` — add Vendors + Purchase Orders nav items
- Update `App.tsx` — add routes `/vendors`, `/purchase-orders`

**Route naming:** use `/purchase-orders` (not `/pos`) for clarity.

### Other document types (same pattern, once POs done)

- [ ] **Quotations / Estimates** — Draft → Sent → Accepted / Declined → converted to Invoice
- [ ] **Credit Notes** — against an existing invoice, reduces amount due
- [ ] **Delivery Challans** — goods shipped, no GST implications
- [ ] **Payment Receipts** — mark invoice as paid, generate a receipt

All of these reuse the same backend pattern (Lambda + table + PDF template) and
frontend pattern (service + page). Each is ~half a day once the pattern is proven.

## Known issues / cleanup

- [ ] `frontend/.env.local` is gitignored — good. But add `frontend/.env.example`
      (committed) with placeholder `VITE_API_URL=https://...` for fresh clones.
- [ ] `Invoices.tsx` is still ~3,900 lines. Split into:
      - `Invoices.tsx` (list)
      - `InvoiceForm.tsx` (create/edit modal)
      - `InvoiceFilters.tsx`
- [ ] Old `frontend/src/services/auth/` files — verify they're still needed after
      Phase 3 rewire (Amplify provides most auth functions).

## Infrastructure reference

- **AWS account:** 990923146026
- **Region:** ap-south-1 (Mumbai)
- **API URL:** https://68ddjixfyg.execute-api.ap-south-1.amazonaws.com/dev
- **Cognito User Pool:** ap-south-1_EfkWMBUfv
- **Cognito Client ID:** 5pdjd9qb8vk8nqnu1upt9g1vo5
- **Amplify app:** AnaxBill (`d1jdrhajlzub2z`)
- **Amplify URL:** https://develop.d1jdrhajlzub2z.amplifyapp.com
- **S3 (PDFs):** anaxbill-pdfs-990923146026
- **SES verified:** anaxenterprise.com + navneet@anaxenterprise.com
- **DynamoDB tables:** AnaxBill_Settings, AnaxBill_Customers,
  AnaxBill_Products, AnaxBill_Invoices, AnaxBill_Counters
- **CloudFormation stack:** anaxbill-backend-v2
- **Git tag:** `backend-complete` = backend fully working (before Phase 3)

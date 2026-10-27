# AnaxBill — Project Handoff

_Last updated: 2026-10-27_

## Where we are

**Production status:** Live and shippable.

**Two working URLs:**
- `https://app.anaxenterprise.com` — **custom domain, HTTPS, working login**
- `https://develop.d1jdrhajlzub2z.amplifyapp.com` — backup URL, also working

**Custom domain:** Configured via Amplify + Hostinger DNS. SSL managed by AWS. Works.

## What's complete

- ✅ Full AWS backend (6 Lambdas: settings, customers, products, invoices, invoices-pdf, invoices-send)
- ✅ 6 DynamoDB tables with multi-tenant isolation by `companyId`
- ✅ Server-side PDF via Chromium in Lambda (x86_64 architecture)
- ✅ S3 bucket for PDFs (`anaxbill-pdfs-990923146026`)
- ✅ SES email delivery (from `navneet@anaxenterprise.com`)
- ✅ Frontend on Amplify with Cognito auth
- ✅ Settings page — AWS-backed with signature toggle
- ✅ Customers page — AWS-backed CRUD
- ✅ Products page — AWS-backed CRUD
- ✅ Invoices page — AWS-backed CRUD + Download PDF + Send Email
- ✅ PDF design v5 (V5-style layout + amount in words + optional signature + red bank accent)
- ✅ Due Date auto-calc from payment terms
- ✅ "Pay By" callout on PDF totals
- ✅ Dynamic Cognito redirects (works on app.anaxenterprise.com, amplifyapp.com, localhost)

## Today's session (2026-10-27)

- ✅ Fixed CORS for app.anaxenterprise.com (custom domain now works)
- ✅ Dashboard reads from API (real data shows on fresh login)
- ✅ Added `startingInvoiceNumber` in Settings (mid-year adoption solved)
- ✅ Invoice counter self-heals to startingNumber
- ✅ First real customer added (Optenix Tech Pvt Ltd)
- ✅ First real invoice generated: ST/2026-27/0016

## What's remaining

### Phase 3.5 — Dashboard + Reports fix (~30 min)

**Problem:** Dashboard KPI cards show 0 on fresh browsers (incognito, custom domain).
- Customers: 0 (should be 1)
- Invoices: 0 (should be 2)
- Outstanding: ₹0 (should be ₹14,160)
- Paid Revenue: ₹0 (correct — nothing is paid yet)

**Root cause:** `Dashboard.tsx` still reads from localStorage for some metrics. The data is correct in DynamoDB; the display logic isn't reading from API.

**Fix needed:**
1. `Dashboard.tsx` — replace localStorage reads with `await customerService.getAll()`, `await invoiceService.getAll()`, `await productService.getAll()` in a `useEffect`
2. Same for `Reports.tsx` if needed
3. Verify in incognito: dashboard should show real data

**Note:** Customers, Products, Settings, Invoices pages all show correct data. Only the Dashboard KPI cards are wrong.

### Then tag `v1-production-complete`

After Dashboard fix works in incognito, tag:


## Infrastructure reference

- **AWS Account:** 990923146026
- **Region:** ap-south-1 (Mumbai)
- **API URL:** `https://68ddjixfyg.execute-api.ap-south-1.amazonaws.com/dev`
- **Cognito User Pool:** `ap-south-1_EfkWMBUfv`
- **Cognito Client ID:** `5pdjd9qb8vk8nqnu1upt9g1vo5`
- **Cognito Domain:** `https://ap-south-1_efkwmbufv.auth.ap-south-1.amazoncognito.com`
- **Amplify App:** AnaxBill (`d1jdrhajlzub2z`)
- **Amplify Env Vars:** VITE_API_URL, VITE_COGNITO_* (all set in Amplify Console)
- **S3 PDFs:** `anaxbill-pdfs-990923146026`
- **SES from:** `navneet@anaxenterprise.com` (verified)
- **CloudFormation:** `anaxbill-backend-v2`
- **DNS:** Hostinger (anaxenterprise.com)
- **DNS records added:** CNAME `app` → CloudFront, CNAME `_f5643d3d...` → ACM validation

## Repo state

- **GitHub:** `github.com/navneet650/anax-cloud-billing`
- **Branch:** `develop` (up to date with origin)
- **Tags (preserved milestones):**
  - `backend-complete` — backend fully working (before frontend rewire)
  - `frontend-v1-aws` — Settings + Customers + Products on AWS
  - `invoices-complete` — Invoices page rebuilt (API + PDF + email)
  - `v1-production-ready` — signature toggle + due date + custom domain DNS working

- **Last commit:** `e5c4441` — "Auth: use window.location.origin for Cognito redirects"

## Tech stack

**Frontend:**
- React 19 + TypeScript + Vite
- Material UI (MUI) + Lucide icons
- aws-amplify v6 (auth)
- react-router-dom v7
- Hosted: AWS Amplify

**Backend:**
- AWS SAM (Serverless Application Model)
- Node.js 20 (ESM)
- Lambda: 4 arm64 + 2 x86_64 (PDF needs x86_64 for Chromium)
- DynamoDB (6 tables)
- Puppeteer + @sparticuz/chromium for PDF
- SES for email
- Cognito authorizer on all routes

**PDF design:**
- HTML + CSS template (`backend/anaxbill-backend/pdf/template.html` + `styles.css`)
- Rendered by Chromium in Lambda
- Matches V5 layout (your pre-existing HTML invoice tool)
- Additional compliance: Amount in words, HSN/SAC tax summary, Due Date + Pay By callout
- Optional signature block (toggle in Settings)
- Red left border on Bank Details

## What to do if resuming fresh

1. **Open the project:** `cd ~/Documents/Projects/anax-cloud-billing`
2. **Verify git is clean:** `git status`
3. **Re-login to AWS CLI if expired:** `aws login`
4. **Frontend dev:** `cd frontend && npm run dev` → `http://localhost:5173`
5. **Check Amplify status:** `console.aws.amazon.com/amplify` → AnaxBill → Hosting → Custom domains
6. **Check backend live:** `aws cloudformation describe-stacks --stack-name anaxbill-backend-v2 --region ap-south-1 --query "Stacks[0].StackStatus" --output text`

## Where to continue tomorrow

**Resume with Phase 3.5:**

> "Let's fix the Dashboard. Open `frontend/src/pages/Dashboard/Dashboard.tsx` and show me lines that use `customerService`, `invoiceService`, or `productService` — I'll send a fix so the KPI cards read from the API."

Expected remaining time: **~30 minutes**. Then tag `v1-production-complete` and you're ready to onboard first customer.

## What's after that (optional, future)

Per `TODO.md` in repo root:
- Purchase Orders (PO) — reuses 90% of invoice infrastructure (~2-3 days)
- Quotations / Estimates
- Credit Notes
- Payment Receipts
- Token auto-refresh in frontend (avoid 401 after 1hr idle)
- Dashboard/Reports polish

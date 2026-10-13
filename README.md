# AnaxBill

Cloud GST billing and invoicing app for Anax Enterprise. The React app currently stores customers, products, invoices, and settings in the browser. Sign-in uses Amazon Cognito. The SAM backend under `backend/anaxbill-backend` is ready to deploy customers to DynamoDB when you want to move off local storage.

## Run the app

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with Cognito.

## What works today

- Dashboard, customers, products, invoices, reports, and settings
- GST invoices with PDF download and bulk ZIP export
- Custom invoice line items plus product/service catalog
- CGST/SGST vs IGST from GSTIN / place of supply

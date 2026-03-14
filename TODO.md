# Create Manual Quotation Feature - COMPLETE ✅

**Backend:**
- ✅ Quote schema updated (isManual, additionalCharge*, gstPercentage)
- ✅ createManualQuote controller (calcs, shareLink)
- ✅ POST /api/quotes/manual route (admin only)

**Frontend:**
- ✅ CreateManualQuotationModal.jsx (search /api/products?q=, items, charges, PDF/jsPDF, submit)
- ✅ QuotesTable.jsx (+ button, modal trigger)

**Next Manual Steps:**
1. cd Tez_Tech && npm i jspdf html2canvas
2. Restart backend (cd backend && npm start)
3. Test: /admin/quotes → Create Manual → search/add products → charges → PDF/save → verify list + share link works

Feature ready! Manual quotes appear in list w/ "Responded" status.

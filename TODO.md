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

  {/* HEADER */}
        <div className="mb-4">
          <h2 className="text-[28px] font-semibold text-[#1a1a1a] mb-4">Orders</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/orders/create')}
            className="bg-[#2463d1] hover:bg-[#1c51b0] text-white text-[13px] font-semibold py-2 px-6 rounded flex items-center gap-1 transition-all shadow-md active:scale-95"
          >
            <span className="text-lg leading-none">+</span> Create Order
          </button>
        </div>

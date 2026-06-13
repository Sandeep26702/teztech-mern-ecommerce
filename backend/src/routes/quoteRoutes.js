import express from 'express';
import { 
  // 🛒 Draft Routes (For React QuoteContext)
  getQuoteDraft,
  addToQuoteDraft,
  updateQuoteDraft,
  removeFromQuoteDraft,

  // 📝 Formal Submission & Management Routes
  createQuote, 
  getMyQuotes,     
  getAllQuotes, 
  getQuoteById, 
  respondToQuote, 
  createManualQuote,
  getQuoteByToken, 
  updateQuoteStatus,
  assignQuote,
  addQuoteCrmNote,
  addClientQuoteComment
} from '../controllers/quoteController.js';

// 🛡️ Importing Auth Middlewares (Path check kar lena apne folder ke hisaab se)
import { protect, admin } from '../middleware/auth.Middleware.js'; 

const router = express.Router();

/* ============================================================
   1. QUOTE DRAFT ROUTES (For React QuoteContext)
   Logic: These routes handle adding/removing items to a user's 
   "Quote Cart" before they finally submit it with their details.
============================================================ */
router.get('/', protect, getQuoteDraft);                      // Fetch current quote list
router.post('/add', protect, addToQuoteDraft);                // Add item to list
router.put('/update', protect, updateQuoteDraft);             // Update quantity
router.delete('/remove/:productId', protect, removeFromQuoteDraft); // Remove item

/* ============================================================
   2. USER ROUTES (Logged-in Users Only)
   Logic: Uses 'protect' to ensure the user is authenticated 
   and links the action to their specific User ID.
============================================================ */

// Submit the finalized quotation request (Converts Draft -> Pending Quote)
router.post('/create', protect, createQuote);

// Fetch only the formally submitted quotations belonging to the logged-in user
router.get('/my-quotes', protect, getMyQuotes);

// Add client comment to their own quote
router.post('/comment/client/:id', protect, addClientQuoteComment);

/* ============================================================
   3. ADMIN ROUTES (Admin & Subadmin Only)
   Logic: Uses 'protect' + 'admin' middlewares. Blocks normal 
   users from accessing global business data.
============================================================ */

// Fetch all quotations for the Admin Dashboard table
router.get('/all', protect, admin, getAllQuotes);

// Fetch a specific quotation's full details for the Admin Editor
router.get('/admin/:id', protect, admin, getQuoteById);

// Admin updates the quote (sets offered prices, discounts, validity)
router.put('/respond/:id', protect, admin, respondToQuote);

// Admin creates manual quotation for WhatsApp clients
router.post('/manual', protect, admin, createManualQuote);

// CRM routes
router.put('/assign/:id', protect, admin, assignQuote);
router.post('/comment/:id', protect, admin, addQuoteCrmNote);

/* ============================================================
   4. PUBLIC ROUTES (Accessible via Shareable Links)
   Logic: No 'protect' needed. Allows customers to view and 
   interact with their quoted link without needing to log in.
============================================================ */

// View quotation details using the unique secret hex token
router.get('/view/:token', getQuoteByToken);

// Customer can Accept or Reject the quotation from the shared link
router.patch('/status/:id', updateQuoteStatus);

export default router;
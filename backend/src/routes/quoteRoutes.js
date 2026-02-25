import express from 'express';
import { 
  createQuote, 
  getAllQuotes, 
  getQuoteById, 
  respondToQuote, 
  getQuoteByToken, 
  updateQuoteStatus 
} from '../controllers/quoteController.js';

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */
// 1. User naya quote form submit karega
router.post('/', createQuote);

// 2. Customer apna "Shareable Link" khulega (Token ke zariye)
router.get('/view/:token', getQuoteByToken);

// 3. Customer quote ko Accept/Reject karega
router.put('/:id/status', updateQuoteStatus);


/* ================= ADMIN ROUTES ================= */
// (Note: Future mein aap yahan apna admin auth middleware laga sakte hain, 
// e.g., router.get('/', protect, admin, getAllQuotes); )

// 4. Admin Panel Table ke liye saare quotes lana
router.get('/', getAllQuotes);

// 5. Admin Panel Editor ke liye ek specific quote lana
router.get('/:id', getQuoteById);

// 6. Admin quote ko modify karke price/link set karega
router.put('/:id/respond', respondToQuote);

export default router;
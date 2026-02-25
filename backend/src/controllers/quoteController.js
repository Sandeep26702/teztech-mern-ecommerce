import Quote from '../models/Quote.js';
import Product from '../models/Product.js'; // 👈 YEH NAYA ADD HUA HAI (Check kar lena path sahi ho)
import crypto from 'crypto';

// ==========================================
// 1. USER: Naya Quote Request Create Karega
// ==========================================
export const createQuote = async (req, res) => {
  try {
    const { userDetails, requestedItems } = req.body;

    if (!requestedItems || requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items in quotation" });
    }

    // 🚀 NAYA LOGIC: Har item ka real price Product database se nikal kar add karna
    const itemsWithPrices = await Promise.all(requestedItems.map(async (item) => {
      // Frontend se item ka jo bhi ID aa raha hai (_id ya productId), usko use karke Product find karo
      const prodId = item.productId || item._id; 
      const product = await Product.findById(prodId);
      
      return {
        ...item,
        // Agar product mil gaya to uska actual price daalo, warna 0 daal do
        originalPrice: product ? product.price : (item.price || 0) 
      };
    }));

    // 🔗 Ek unique, unguessable token generate karo (Direct Link ke liye)
    const token = crypto.randomBytes(12).toString('hex');

    const newQuote = new Quote({
      userDetails,
      requestedItems: itemsWithPrices, // 👈 Yahan bina price wale items ki jagah updated items daale
      quoteToken: token, 
      status: "Pending"
    });

    await newQuote.save();

    // 📧 ================= EMAIL LOGIC (Nodemailer) ================= 📧
    // await sendEmail({ ... })
    // ===============================================================

    res.status(201).json({ 
      success: true, 
      message: "Quotation submitted successfully!", 
      quoteId: newQuote._id
    });

  } catch (error) {
    console.error("Quote Creation Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ==========================================
// 2. ADMIN: Quote ko modify/price dega
// ==========================================
export const respondToQuote = async (req, res) => {
  try {
    const { id } = req.params; // Route params se ID li
    const { requestedItems, adminNotes, totalDiscount, finalTotal, validUntil } = req.body;

    // Quote find karke usko update karenge
    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      {
        requestedItems, 
        adminNotes,
        totalDiscount,
        finalTotal,
        validUntil,
        status: "Responded" 
      },
      { new: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    // 🔗 Final shareable link taiyaar karna
    const shareableLink = `${process.env.FRONTEND_URL}/quote/${updatedQuote.quoteToken}`;

    // 📧 ================= EMAIL LOGIC (Nodemailer) ================= 📧
    // await sendEmail({ ... })
    // ===============================================================

    res.status(200).json({
      success: true,
      message: "Quote updated and sent to user!",
      link: shareableLink, 
      quote: updatedQuote
    });

  } catch (error) {
    console.error("Quote Respond Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 3. ADMIN: Saare Quotes Table ke liye nikalna
// ==========================================
export const getAllQuotes = async (req, res) => {
  try {
    // Sabse naye quotes pehle dikhenge (Descending order)
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error("Fetch All Quotes Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 4. ADMIN: Single Quote Details nikalna (Editor ke liye)
// ==========================================
export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    res.status(200).json({ success: true, quote });
  } catch (error) {
    console.error("Fetch Single Quote Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 5. PUBLIC: Token (Link) se Quote nikalna
// ==========================================
export const getQuoteByToken = async (req, res) => {
  try {
    const quote = await Quote.findOne({ quoteToken: req.params.token });
    if (!quote) {
      return res.status(404).json({ success: false, message: "Invalid or expired link" });
    }
    res.status(200).json({ success: true, quote });
  } catch (error) {
    console.error("Fetch Quote by Token Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 6. PUBLIC: Quote ka status Accept/Reject karna
// ==========================================
export const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await Quote.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.status(200).json({ success: true, quote });
  } catch (error) {
    console.error("Update Quote Status Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
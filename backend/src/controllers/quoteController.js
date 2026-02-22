const Quote = require('../models/Quote');

exports.createQuote = async (req, res) => {
  try {
    const { userDetails, requestedItems } = req.body;

    if (!requestedItems || requestedItems.length === 0) {
      return res.status(400).json({ message: "No items in quotation" });
    }

    const newQuote = new Quote({
      userDetails,
      requestedItems
    });

    await newQuote.save();

    res.status(201).json({ 
      success: true, 
      message: "Quotation submitted successfully!", 
      quote: newQuote 
    });

  } catch (error) {
    console.error("Quote Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
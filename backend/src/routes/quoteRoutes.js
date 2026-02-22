const express = require('express');
const router = express.Router();
const { createQuote } = require('../controllers/quoteController');

// POST request to submit quote
router.post('/', createQuote);

module.exports = router;

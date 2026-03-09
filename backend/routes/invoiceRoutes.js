const express = require('express');
const router = express.Router();
const { getInvoices } = require('../controllers/invoiceController');
const protect = require('../middleware/auth');

// Protect all invoice routes
router.use(protect);

router.get('/', getInvoices);

module.exports = router;

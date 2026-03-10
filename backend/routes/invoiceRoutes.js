const express = require('express');
const router = express.Router();
const { getInvoices, updateInvoice } = require('../controllers/invoiceController');
const protect = require('../middleware/auth');

// Protect all invoice routes
router.use(protect);

router.get('/', getInvoices);
router.put('/:id', updateInvoice);

module.exports = router;

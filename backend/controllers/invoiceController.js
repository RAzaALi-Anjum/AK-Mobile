const Invoice = require('../models/Invoice');

// @desc    Get all generated invoices
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({}).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getInvoices };

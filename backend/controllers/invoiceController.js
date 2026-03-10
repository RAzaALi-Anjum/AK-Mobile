const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

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

// @desc    Update invoice (add payments/products)
// @route   PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPayment, newProducts, discount } = req.body;

        const invoice = await Invoice.findById(id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // If new products are added, we must verify stock and create Sale records
        if (newProducts && newProducts.length > 0) {
            for (const item of newProducts) {
                const product = await Product.findById(item.productId);
                if (!product || product.quantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${item.productName}` });
                }

                // Reduce stock
                product.quantity -= item.quantity;
                await product.save();

                const totalPurchaseCost = item.purchaseCostPerUnit * item.quantity;
                const totalSale = item.salePricePerUnit * item.quantity;
                const profit = totalSale - totalPurchaseCost;

                // Create Sale record
                await Sale.create({
                    productId: item.productId,
                    productName: item.productName,
                    productType: item.productType,
                    quantitySold: item.quantity,
                    purchaseCostPerUnit: item.purchaseCostPerUnit,
                    salePricePerUnit: item.salePricePerUnit,
                    totalPurchaseCost,
                    totalSale,
                    profit,
                    saleDate: new Date(),
                });

                // Add to invoice products
                invoice.products.push({
                    productId: item.productId,
                    productName: item.productName,
                    productType: item.productType,
                    quantity: item.quantity,
                    purchaseCostPerUnit: item.purchaseCostPerUnit,
                    salePricePerUnit: item.salePricePerUnit,
                    totalSale: totalSale
                });
            }
        }

        // Recalculate totals
        invoice.totalAmount = invoice.products.reduce((sum, p) => sum + p.totalSale, 0);

        if (discount !== undefined) {
            invoice.discountAmount = Number(discount);
        }

        if (invoice.discountAmount > invoice.totalAmount) {
            return res.status(400).json({ message: 'Discount cannot exceed total amount' });
        }

        // Ensure discountAmount is a valid number before calculation
        const safeDiscount = invoice.discountAmount || 0;
        invoice.grandTotal = invoice.totalAmount - safeDiscount;

        // Ensure paidAmount is a valid number
        invoice.paidAmount = invoice.paidAmount || 0;

        // Extract new payment
        const paymentAmt = Number(newPayment) || 0;
        if (paymentAmt > 0) {
            invoice.paymentHistory.push({ date: new Date(), amount: paymentAmt });
            invoice.paidAmount += paymentAmt;
        }

        if (invoice.paidAmount > invoice.grandTotal) {
            return res.status(400).json({ message: 'Paid amount cannot exceed grand total' });
        }

        invoice.remainingAmount = invoice.grandTotal - invoice.paidAmount;
        invoice.orderStatus = invoice.remainingAmount > 0 ? 'Pending' : 'Paid';

        if (invoice.paymentHistory.length > 1 && invoice.remainingAmount > 0) {
            invoice.paymentType = 'Partial Payment';
        }

        await invoice.save();

        res.json({ message: 'Invoice updated successfully', invoice });
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getInvoices, updateInvoice };

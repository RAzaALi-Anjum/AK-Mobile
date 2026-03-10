const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// @desc    Checkout cart — process sale, reduce stock, calculate profit
// @route   POST /api/sales/checkout
const checkout = async (req, res) => {
    try {
        const { items, clientName, clientPhone, discount, paymentType, paidAmount } = req.body;
        // items: [{ productId, productName, productType, quantity, purchaseCostPerUnit, salePricePerUnit }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        if (!clientName || !clientPhone) {
            return res.status(400).json({ message: 'Client Name and Phone are required' });
        }

        const salesRecords = [];

        for (const item of items) {
            const { productId, productName, productType, quantity, purchaseCostPerUnit, salePricePerUnit } = item;

            if (!productId || !quantity || !salePricePerUnit) {
                return res.status(400).json({ message: 'Invalid item data' });
            }

            // Verify product and stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${productName} not found` });
            }
            if (product.quantity < quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${productName}. Available: ${product.quantity}`,
                });
            }

            const totalPurchaseCost = purchaseCostPerUnit * quantity;
            const totalSale = salePricePerUnit * quantity;
            const profit = totalSale - totalPurchaseCost;

            // Reduce stock
            product.quantity -= quantity;
            await product.save();

            // Create sale record
            const sale = await Sale.create({
                productId,
                productName,
                productType,
                quantitySold: quantity,
                purchaseCostPerUnit,
                salePricePerUnit,
                totalPurchaseCost,
                totalSale,
                profit,
                saleDate: new Date(),
            });

            salesRecords.push(sale);
        }

        // Generate Invoice Number
        const currentCount = await Invoice.countDocuments();
        const invoiceNumber = `INV${currentCount + 1}`;

        // Create Invoice Record
        const totalAmount = salesRecords.reduce((sum, sale) => sum + sale.totalSale, 0);
        const discountAmount = Number(discount) || 0;

        if (discountAmount > totalAmount) {
            return res.status(400).json({ message: 'Discount cannot exceed total amount' });
        }

        const grandTotal = totalAmount - discountAmount;
        let finalPaidAmount = Number(paidAmount) || 0;
        const pType = paymentType || 'Full Payment';

        if (pType === 'Full Payment') {
            finalPaidAmount = grandTotal;
        }

        if (finalPaidAmount > grandTotal) {
            return res.status(400).json({ message: 'Paid amount cannot exceed grand total' });
        }

        const remainingAmount = grandTotal - finalPaidAmount;
        const orderStatus = remainingAmount > 0 ? 'Pending' : 'Paid';

        const paymentHistory = [];
        if (finalPaidAmount > 0) {
            paymentHistory.push({ date: new Date(), amount: finalPaidAmount });
        }

        const invoiceData = items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productType: item.productType,
            quantity: item.quantity,
            purchaseCostPerUnit: item.purchaseCostPerUnit,
            salePricePerUnit: item.salePricePerUnit,
            totalSale: item.salePricePerUnit * item.quantity,
        }));

        const invoice = await Invoice.create({
            invoiceNumber,
            clientName,
            clientPhone,
            products: invoiceData,
            totalAmount,
            discountAmount,
            grandTotal,
            paymentType: pType,
            paidAmount: finalPaidAmount,
            remainingAmount,
            paymentHistory,
            orderStatus
        });

        console.log("SALE_CHECKOUT_SUCCESS_INVOICE_CREATED:", JSON.stringify(invoice, null, 2));

        res.status(201).json({
            message: 'Sale completed successfully',
            sales: salesRecords,
            invoice: invoice,
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all sales (with optional type filter)
// @route   GET /api/sales?type=Laptop
const getSales = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) {
            filter.productType = req.query.type;
        }
        const sales = await Sale.find(filter).sort({ saleDate: -1 });
        res.json(sales);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get income data with daily totals, summary, date & category filtering
// @route   GET /api/sales/income?type=Laptop&from=2025-01-01&to=2025-12-31
const getIncome = async (req, res) => {
    try {
        const filter = {};

        // Category filter
        if (req.query.type) {
            filter['products.productType'] = req.query.type;
        }

        // Date range filter based on invoice creation for the overall list
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) {
                filter.createdAt.$gte = new Date(req.query.from);
            }
            if (req.query.to) {
                const toDate = new Date(req.query.to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }

        const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

        // Calculate summary totals
        let totalSales = 0;
        let totalPurchaseCost = 0;

        // Group by date for daily totals
        const dailyTotals = {};

        const initDay = (dateKey) => {
            if (!dailyTotals[dateKey]) {
                dailyTotals[dateKey] = {
                    date: dateKey,
                    totalSales: 0,
                    totalPurchaseCost: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                };
            }
        };

        invoices.forEach((invoice) => {
            const invoicePurchaseCost = invoice.products.reduce((sum, p) => sum + ((p.purchaseCostPerUnit || 0) * (p.quantity || 1)), 0);

            totalPurchaseCost += invoicePurchaseCost;

            // Fallback for older records missing paidAmount
            const actualPaidAmount = invoice.paidAmount !== undefined ? invoice.paidAmount : (invoice.totalAmount || 0);
            totalSales += actualPaidAmount;

            // Purchase cost applies to the day the invoice was created
            const createDateKey = new Date(invoice.createdAt || Date.now()).toISOString().split('T')[0];
            initDay(createDateKey);
            dailyTotals[createDateKey].totalPurchaseCost += invoicePurchaseCost;

            // Payments apply to the day they were made
            if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
                invoice.paymentHistory.forEach(payment => {
                    if (payment.date && payment.amount) {
                        const payDateKey = new Date(payment.date).toISOString().split('T')[0];
                        initDay(payDateKey);
                        dailyTotals[payDateKey].totalSales += payment.amount;
                    }
                });
            } else if (!invoice.paymentHistory || invoice.paymentHistory.length === 0) {
                // Fallback for old records with no distinct payment history - attribute to creation date
                dailyTotals[createDateKey].totalSales += actualPaidAmount;
            }
        });

        const overallProfit = totalSales - totalPurchaseCost;
        const totalProfit = overallProfit > 0 ? overallProfit : 0;
        const totalLoss = overallProfit < 0 ? Math.abs(overallProfit) : 0;

        Object.keys(dailyTotals).forEach(key => {
            const day = dailyTotals[key];
            const dayProfit = day.totalSales - day.totalPurchaseCost;
            if (dayProfit > 0) {
                day.totalProfit = dayProfit;
            } else if (dayProfit < 0) {
                day.totalLoss = Math.abs(dayProfit);
            }
        });

        res.json({
            sales: invoices, // Reusing 'sales' key for frontend compatibility (now holding Invoices)
            summary: {
                totalSales,
                totalPurchaseCost,
                totalProfit,
                totalLoss,
            },
            dailyTotals: Object.values(dailyTotals).sort((a, b) => b.date.localeCompare(a.date)),
        });
    } catch (error) {
        console.error('Get income error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/sales/dashboard-stats
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        // --- Monthly Purchase Data (current month, day by day) ---
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const monthlyPurchases = await Product.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$purchaseDate' },
                    total: { $sum: { $multiply: ['$purchaseAmount', '$quantity'] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // --- Yearly Purchase Data (month by month) ---
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        const yearlyPurchases = await Product.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: yearStart, $lte: yearEnd },
                },
            },
            {
                $group: {
                    _id: { $month: '$purchaseDate' },
                    total: { $sum: { $multiply: ['$purchaseAmount', '$quantity'] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Fetch all invoices relevant to the current year
        const invoices = await Invoice.find({
            $or: [
                { createdAt: { $gte: yearStart, $lte: yearEnd } },
                { 'paymentHistory.date': { $gte: yearStart, $lte: yearEnd } }
            ]
        });

        const monthlySalesMap = {}; // for current month, day by day
        const yearlySalesMap = {};  // for current year, month by month

        // Initialize maps
        for (let d = 1; d <= monthEnd.getDate(); d++) {
            monthlySalesMap[d] = { _id: d, totalSales: 0, totalProfit: 0, purchaseCost: 0 };
        }
        for (let m = 1; m <= 12; m++) {
            yearlySalesMap[m] = { _id: m, totalSales: 0, totalProfit: 0, purchaseCost: 0 };
        }

        invoices.forEach(inv => {
            const invoiceCost = inv.products.reduce((acc, p) => acc + (p.purchaseCostPerUnit * p.quantity), 0);

            // Assign cost based on creation date
            const created = new Date(inv.createdAt);
            if (created >= yearStart && created <= yearEnd) {
                const m = created.getMonth() + 1;
                yearlySalesMap[m].purchaseCost += invoiceCost;

                if (created >= monthStart && created <= monthEnd) {
                    const d = created.getDate();
                    monthlySalesMap[d].purchaseCost += invoiceCost;
                }
            }

            // Assign sales based on payment dates
            if (inv.paymentHistory) {
                inv.paymentHistory.forEach(payment => {
                    const pDate = new Date(payment.date);
                    if (pDate >= yearStart && pDate <= yearEnd) {
                        const m = pDate.getMonth() + 1;
                        yearlySalesMap[m].totalSales += payment.amount;

                        if (pDate >= monthStart && pDate <= monthEnd) {
                            const d = pDate.getDate();
                            monthlySalesMap[d].totalSales += payment.amount;
                        }
                    }
                });
            }
        });

        // Compute profit = totalSales - purchaseCost for each interval
        const monthlySales = Object.values(monthlySalesMap).map(day => ({
            _id: day._id,
            totalSales: day.totalSales,
            totalProfit: day.totalSales - day.purchaseCost
        })).sort((a, b) => a._id - b._id);

        const yearlySales = Object.values(yearlySalesMap).map(month => ({
            _id: month._id,
            totalSales: month.totalSales,
            totalProfit: month.totalSales - month.purchaseCost
        })).sort((a, b) => a._id - b._id);

        res.json({
            currentMonth: now.toLocaleString('default', { month: 'long' }),
            currentYear,
            daysInMonth: monthEnd.getDate(),
            monthlyPurchases,
            yearlyPurchases,
            monthlySales,
            yearlySales,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { checkout, getSales, getIncome, getDashboardStats };

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// @desc    Checkout cart — process sale, reduce stock, calculate profit
// @route   POST /api/sales/checkout
const checkout = async (req, res) => {
    try {
        const { items, clientName, clientPhone } = req.body;
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

        const invoiceData = items.map(item => ({
            productId: item.productId,
            productName: item.productName,
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
            totalAmount
        });

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
            filter.productType = req.query.type;
        }

        // Date range filter
        if (req.query.from || req.query.to) {
            filter.saleDate = {};
            if (req.query.from) {
                filter.saleDate.$gte = new Date(req.query.from);
            }
            if (req.query.to) {
                const toDate = new Date(req.query.to);
                toDate.setHours(23, 59, 59, 999);
                filter.saleDate.$lte = toDate;
            }
        }

        const sales = await Sale.find(filter).sort({ saleDate: -1 });

        // Calculate summary totals
        let totalSales = 0;
        let totalPurchaseCost = 0;
        let totalProfit = 0;
        let totalLoss = 0;

        // Group by date for daily totals
        const dailyTotals = {};
        sales.forEach((sale) => {
            totalSales += sale.totalSale;
            totalPurchaseCost += sale.totalPurchaseCost;
            if (sale.profit >= 0) {
                totalProfit += sale.profit;
            } else {
                totalLoss += Math.abs(sale.profit);
            }

            const dateKey = new Date(sale.saleDate).toISOString().split('T')[0];
            if (!dailyTotals[dateKey]) {
                dailyTotals[dateKey] = {
                    date: dateKey,
                    totalSales: 0,
                    totalPurchaseCost: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                };
            }
            dailyTotals[dateKey].totalSales += sale.totalSale;
            dailyTotals[dateKey].totalPurchaseCost += sale.totalPurchaseCost;
            if (sale.profit >= 0) {
                dailyTotals[dateKey].totalProfit += sale.profit;
            } else {
                dailyTotals[dateKey].totalLoss += Math.abs(sale.profit);
            }
        });

        res.json({
            sales,
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

        // --- Monthly Sales & Profit (current month, day by day) ---
        const monthlySales = await Sale.aggregate([
            {
                $match: {
                    saleDate: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$saleDate' },
                    totalSales: { $sum: '$totalSale' },
                    totalProfit: { $sum: '$profit' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // --- Yearly Sales & Profit (month by month) ---
        const yearlySales = await Sale.aggregate([
            {
                $match: {
                    saleDate: { $gte: yearStart, $lte: yearEnd },
                },
            },
            {
                $group: {
                    _id: { $month: '$saleDate' },
                    totalSales: { $sum: '$totalSale' },
                    totalProfit: { $sum: '$profit' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

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

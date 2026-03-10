const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        clientName: {
            type: String,
            required: true,
        },
        clientPhone: {
            type: String,
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                productName: String,
                productType: String,
                quantity: Number,
                purchaseCostPerUnit: Number, // Storing for record-keeping if needed later
                salePricePerUnit: Number,
                totalSale: Number,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
        },
        paymentType: {
            type: String,
            enum: ['Full Payment', 'Partial Payment'],
            default: 'Full Payment',
        },
        paidAmount: {
            type: Number,
            required: true,
        },
        remainingAmount: {
            type: Number,
            required: true,
        },
        paymentHistory: [
            {
                date: { type: Date, default: Date.now },
                amount: { type: Number, required: true },
            }
        ],
        orderStatus: {
            type: String,
            enum: ['Paid', 'Pending'],
            default: 'Paid',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

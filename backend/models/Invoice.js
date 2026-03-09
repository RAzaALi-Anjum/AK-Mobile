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
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

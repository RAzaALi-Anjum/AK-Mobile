const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        productType: {
            type: String,
            required: true,
        },
        quantitySold: {
            type: Number,
            required: true,
            min: 1,
        },
        purchaseCostPerUnit: {
            type: Number,
            required: true,
        },
        salePricePerUnit: {
            type: Number,
            required: true,
        },
        totalPurchaseCost: {
            type: Number,
            required: true,
        },
        totalSale: {
            type: Number,
            required: true,
        },
        profit: {
            type: Number,
            required: true,
        },
        saleDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);

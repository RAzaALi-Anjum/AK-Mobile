const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        productType: {
            type: String,
            required: [true, 'Product type is required'],
            enum: ['Laptop', 'Camera', 'Accessories'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative'],
        },
        purchaseAmount: {
            type: Number,
            required: [true, 'Purchase amount is required'],
            min: [0, 'Purchase amount cannot be negative'],
        },
        purchaseDate: {
            type: Date,
            required: [true, 'Purchase date is required'],
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

const Product = require('../models/Product');
const XLSX = require('xlsx');

// @desc    Get all products (with optional type filter)
// @route   GET /api/products?type=Laptop
const getProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) {
            filter.productType = req.query.type;
        }
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const { productName, productType, quantity, purchaseAmount, purchaseDate } = req.body;

        if (!productName || !productType || quantity == null || purchaseAmount == null) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = await Product.create({
            productName,
            productType,
            quantity: Number(quantity),
            purchaseAmount: Number(purchaseAmount),
            purchaseDate: purchaseDate || Date.now(),
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { productName, productType, quantity, purchaseAmount, purchaseDate } = req.body;

        product.productName = productName || product.productName;
        product.productType = productType || product.productType;
        product.quantity = quantity != null ? Number(quantity) : product.quantity;
        product.purchaseAmount = purchaseAmount != null ? Number(purchaseAmount) : product.purchaseAmount;
        product.purchaseDate = purchaseDate || product.purchaseDate;

        const updated = await product.save();
        res.json(updated);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Month name patterns for detecting header rows
const MONTH_NAMES = [
    'jan', 'january', 'feb', 'february', 'mar', 'march',
    'apr', 'april', 'may', 'jun', 'june',
    'jul', 'july', 'aug', 'august', 'sep', 'september',
    'oct', 'october', 'nov', 'november', 'dec', 'december',
];

/**
 * Check if a string looks like a month+year header, e.g. "Feb 2026", "January 2025"
 * Returns a Date (1st of that month) or null.
 */
const parseMonthHeader = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    // Match patterns like "Feb 2026", "February 2026", "feb-2026", "Feb-26" etc.
    const match = trimmed.match(/^([a-zA-Z]+)[\s\-\/]+(\d{2,4})$/i);
    if (!match) return null;
    const monthStr = match[1].toLowerCase();
    let yearStr = match[2];
    if (!MONTH_NAMES.includes(monthStr)) return null;
    // Handle 2-digit year
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const date = new Date(`${match[1]} 1, ${yearStr}`);
    if (isNaN(date.getTime())) return null;
    return date;
};

// @desc    Bulk upload products from Excel (hierarchical format)
// @route   POST /api/products/bulk-upload
const bulkUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Product type from form (used when Excel doesn't have a Product Type column)
        const formProductType = req.body.productType || '';
        const validTypes = ['Laptop', 'Camera', 'Accessories'];

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use header: 1 for raw array rows to handle the hierarchical structure
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        // --- Detect if the Excel has a Product Type column ---
        // Check the first row (header) for a "Product Type" column
        const headerRow = rawRows[0].map((h) => String(h).trim().toLowerCase());
        const hasProductTypeCol = headerRow.some(
            (h) => h === 'product type' || h === 'producttype' || h === 'type'
        );
        const productTypeColIdx = hasProductTypeCol
            ? headerRow.findIndex((h) => h === 'product type' || h === 'producttype' || h === 'type')
            : -1;

        // If no Product Type column in Excel and no type selected in form, error out
        if (!hasProductTypeCol && !formProductType) {
            return res.status(400).json({
                message: 'Please select a Product Type before uploading, or include a "Product Type" column in your Excel file.',
            });
        }

        if (formProductType && !validTypes.includes(formProductType)) {
            return res.status(400).json({
                message: `Invalid product type "${formProductType}". Must be one of: ${validTypes.join(', ')}`,
            });
        }

        const products = [];
        const errors = [];
        let currentPurchaseDate = null;

        // Skip header row (index 0), process from index 1
        for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            const excelRowNum = i + 1; // 1-indexed for user-friendly messages

            // Skip completely empty rows
            if (!row || row.every((cell) => cell === '' || cell == null)) continue;

            const col0 = row[0]; // Sr No
            const col1 = String(row[1] || '').trim(); // Month and Product
            const col2 = Number(row[2]) || 0; // Quantity
            const col3 = Number(row[3]) || 0; // Amount (PKR)

            // --- Is this a Month header row? ---
            // A month header has a Sr No (numeric) AND col1 matches a month pattern
            const parsedDate = parseMonthHeader(col1);
            if (col0 !== '' && col0 != null && !isNaN(Number(col0)) && parsedDate) {
                // This is a purchase date header row
                currentPurchaseDate = parsedDate;
                // The quantity and amount on this row are totals — we skip them
                continue;
            }

            // --- Product row ---
            if (!col1) {
                // Empty product name, skip silently
                continue;
            }

            if (!currentPurchaseDate) {
                errors.push(`Row ${excelRowNum}: Product "${col1}" found before any month header row`);
                continue;
            }

            if (col2 <= 0 || isNaN(col2)) {
                errors.push(`Row ${excelRowNum}: Invalid quantity for "${col1}"`);
                continue;
            }

            if (col3 <= 0 || isNaN(col3)) {
                errors.push(`Row ${excelRowNum}: Invalid amount for "${col1}"`);
                continue;
            }

            // Calculate unit price: totalAmount / quantity
            const unitPrice = col3 / col2;

            // Determine product type
            let productType = formProductType;
            if (hasProductTypeCol && productTypeColIdx >= 0) {
                const cellType = String(row[productTypeColIdx] || '').trim();
                if (cellType) productType = cellType;
            }

            if (!productType) {
                errors.push(`Row ${excelRowNum}: Missing product type for "${col1}"`);
                continue;
            }

            if (!validTypes.includes(productType)) {
                errors.push(
                    `Row ${excelRowNum}: Invalid product type "${productType}" for "${col1}". Must be one of: ${validTypes.join(', ')}`
                );
                continue;
            }

            products.push({
                productName: col1,
                productType,
                quantity: col2,
                purchaseAmount: Math.round(unitPrice * 100) / 100, // unit price, rounded to 2 decimals
                purchaseDate: currentPurchaseDate,
            });
        }

        if (products.length === 0) {
            return res.status(400).json({
                message: 'No valid products found in the file',
                errors,
            });
        }

        const inserted = await Product.insertMany(products);

        res.status(201).json({
            message: `${inserted.length} product(s) uploaded successfully`,
            insertedCount: inserted.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ message: 'Failed to process Excel file' });
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, bulkUpload };

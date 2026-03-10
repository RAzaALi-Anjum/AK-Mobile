import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CATEGORIES = ['All', 'Laptop', 'Camera'];

const IncomePage = () => {
    const [income, setIncome] = useState({ sales: [], dailyTotals: [], summary: { totalSales: 0, totalPurchaseCost: 0, totalProfit: 0, totalLoss: 0 } });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [actionType, setActionType] = useState('payment'); // 'payment' or 'product'
    const [newPaymentAmount, setNewPaymentAmount] = useState('');
    // For products
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [newProductQuantity, setNewProductQuantity] = useState(1);
    const [newProductSalePrice, setNewProductSalePrice] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

    // For Add Product Checkout Fields
    const [discount, setDiscount] = useState('');
    const [paymentType, setPaymentType] = useState('Full Payment');
    const [paidAmount, setPaidAmount] = useState('');

    const fetchProducts = useCallback(async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data.filter(p => p.quantity > 0));
        } catch (err) {
            console.error('Failed to fetch products', err);
        }
    }, []);

    useEffect(() => {
        // Fetch products for the 'Add Product' functionality initially
        fetchProducts();
    }, [fetchProducts]);

    const fetchIncome = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCategory !== 'All') params.append('type', activeCategory);
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            const query = params.toString() ? `?${params.toString()}` : '';
            const { data } = await api.get(`/sales/income${query}`);
            setIncome(data);
        } catch (err) {
            console.error('Failed to fetch income:', err);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, fromDate, toDate]);

    useEffect(() => {
        fetchIncome();
    }, [fetchIncome]);

    const filteredSales = income.sales.filter(invoice =>
        (invoice.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (invoice.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const handleOpenUpdate = (invoice) => {
        setSelectedInvoice(invoice);
        setShowUpdateModal(true);
        setActionType('payment');
        setNewPaymentAmount('');
        setSelectedProduct('');
        setNewProductQuantity(1);
        setNewProductSalePrice('');
        setDiscount('');
        setPaymentType('Full Payment');
        setPaidAmount('');
        setUpdateError('');
        setUpdateSuccess('');
        fetchProducts(); // Refresh products list
    };

    const handleUpdateSubmit = async () => {
        if (actionType === 'payment' && !newPaymentAmount) {
            setUpdateError('Please enter a payment amount');
            return;
        }
        if (actionType === 'product' && (!selectedProduct || !newProductSalePrice)) {
            setUpdateError('Please select a product and enter sale price');
            return;
        }

        setUpdateLoading(true);
        setUpdateError('');
        setUpdateSuccess('');

        try {
            const payload = {};
            if (actionType === 'payment') {
                payload.newPayment = Number(newPaymentAmount);
            } else if (actionType === 'product') {
                const prod = products.find(p => p._id === selectedProduct);
                if (!prod) return;
                payload.newProducts = [{
                    productId: prod._id,
                    productName: prod.productName,
                    productType: prod.productType,
                    quantity: Number(newProductQuantity),
                    purchaseCostPerUnit: prod.purchaseAmount,
                    salePricePerUnit: Number(newProductSalePrice)
                }];

                const discountAmt = Number(discount) || 0;
                const totalSale = Number(newProductSalePrice) * Number(newProductQuantity);

                if (discountAmt > totalSale) {
                    setUpdateError('Discount cannot exceed the total sale amount of the added product(s)');
                    setUpdateLoading(false);
                    return;
                }

                payload.discount = discountAmt;

                const grandTotal = totalSale - discountAmt;
                const finalPaidAmt = paymentType === 'Full Payment' ? grandTotal : (Number(paidAmount) || 0);

                if (finalPaidAmt > grandTotal) {
                    setUpdateError('Paid amount cannot exceed the grand total of the added product(s)');
                    setUpdateLoading(false);
                    return;
                }

                payload.paymentType = paymentType;
                payload.newPayment = finalPaidAmt;
            }

            await api.put(`/invoices/${selectedInvoice._id}`, payload);
            setUpdateSuccess('Invoice updated successfully!');
            setTimeout(() => {
                setShowUpdateModal(false);
                fetchIncome();
            }, 1000);
        } catch (err) {
            setUpdateError(err.response?.data?.message || 'Update failed');
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Income Report</h1>
                <p className="page-subtitle">Track your sales, profit, and loss</p>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'All' ? '📦 All' : cat === 'Laptop' ? '💻 Laptop' : '📷 Camera'}
                    </button>
                ))}
            </div>

            {/* Date Filters */}
            <div className="filter-row">
                <div className="filter-group">
                    <label>From Date</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>To Date</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                {(fromDate || toDate) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>
                        Clear Dates
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-bar-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Search sale by product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-input"
                    style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Summary Dashboard */}
                    <div className="income-summary-grid">
                        <div className="summary-stat-card sales">
                            <div className="summary-stat-label">Total Sales</div>
                            <div className="summary-stat-value text-primary-accent">
                                PKR {income.summary?.totalSales?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card purchases">
                            <div className="summary-stat-label">Total Purchases</div>
                            <div className="summary-stat-value text-warning">
                                PKR {income.summary?.totalPurchaseCost?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card profit">
                            <div className="summary-stat-label">Total Profit</div>
                            <div className="summary-stat-value text-success">
                                PKR {income.summary?.totalProfit?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card loss">
                            <div className="summary-stat-label">Total Loss</div>
                            <div className="summary-stat-value text-danger">
                                PKR {income.summary?.totalLoss?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>

                    {/* Sales Table */}
                    {filteredSales.length === 0 ? (
                        <div className="empty-state">
                            <p>No sales recorded{activeCategory !== 'All' ? ` for ${activeCategory}` : ''}{fromDate || toDate ? ' in selected date range' : ''}.</p>
                        </div>
                    ) : (
                        <>
                            <div className="cart-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Inv #</th>
                                            <th>Client</th>
                                            <th>Products</th>
                                            <th>Grand Total</th>
                                            <th>Paid</th>
                                            <th>Remaining</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map((invoice) => (
                                            <tr key={invoice._id}>
                                                <td className="fw-600">{invoice.invoiceNumber}</td>
                                                <td>{invoice.clientName}</td>
                                                <td>
                                                    <div style={{ fontSize: '12px', color: '#666', maxWidth: '150px' }}>
                                                        {invoice.products?.map(p => `${p.productName} (x${p.quantity})`).join(', ')}
                                                    </div>
                                                </td>
                                                <td>PKR {(invoice.grandTotal || invoice.totalAmount || 0).toLocaleString()}</td>
                                                <td className="text-success">PKR {(invoice.paidAmount || 0).toLocaleString()}</td>
                                                <td className="text-danger">PKR {(invoice.remainingAmount || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`table-badge ${(invoice.orderStatus === 'Paid' || (!invoice.orderStatus && (invoice.remainingAmount === 0 || invoice.remainingAmount === undefined)))
                                                        ? 'badge-success' : 'badge-warning'
                                                        }`}>
                                                        {invoice.orderStatus || (invoice.remainingAmount > 0 ? 'Pending' : 'Paid')}
                                                    </span>
                                                </td>
                                                <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenUpdate(invoice)}>
                                                        Update
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Daily Report */}
                            <div className="income-daily-section">
                                <h2>Daily Income Report</h2>
                                <div className="cart-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Total Sales</th>
                                                <th>Total Purchase Cost</th>
                                                <th>Profit</th>
                                                <th>Loss</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {income.dailyTotals.map((day) => (
                                                <tr key={day.date}>
                                                    <td className="fw-600">
                                                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td>PKR {day.totalSales.toLocaleString()}</td>
                                                    <td>PKR {day.totalPurchaseCost.toLocaleString()}</td>
                                                    <td className="text-success">PKR {day.totalProfit.toLocaleString()}</td>
                                                    <td className="text-danger">PKR {day.totalLoss.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Update Modal */}
                    {showUpdateModal && selectedInvoice && (
                        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div className="modal-content" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0 }}>Update Invoice {selectedInvoice.invoiceNumber}</h2>
                                    <button onClick={() => setShowUpdateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                                        &times;
                                    </button>
                                </div>

                                {updateError && <div className="alert alert-error">{updateError}</div>}
                                {updateSuccess && <div className="alert alert-success">{updateSuccess}</div>}

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <button
                                            className={`btn ${actionType === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setActionType('payment')}
                                            style={{ flex: 1 }}
                                        >
                                            Add Payment
                                        </button>
                                        <button
                                            className={`btn ${actionType === 'product' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setActionType('product')}
                                            style={{ flex: 1 }}
                                        >
                                            Add Product
                                        </button>
                                    </div>

                                    {actionType === 'payment' && (
                                        <div>
                                            <p style={{ marginBottom: '10px', textTransform: 'uppercase', color: '#666', fontSize: '13px' }}><strong>Remaining Balance: </strong><span style={{ color: '#333' }}>PKR {(selectedInvoice.remainingAmount || 0).toLocaleString()}</span></p>
                                            <div className="form-group">
                                                <label style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Payment Amount (PKR)</label>
                                                <input
                                                    type="number"
                                                    className="table-input"
                                                    value={newPaymentAmount}
                                                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                                                    placeholder="Enter amount"
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {actionType === 'product' && (
                                        <div>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Select Product</label>
                                                <select
                                                    className="table-input"
                                                    value={selectedProduct}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedProduct(val);
                                                        setNewProductSalePrice(''); // Always clear on product change so user enters it manually
                                                    }}
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                >
                                                    <option value="">-- Choose Product --</option>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p._id}>{p.productName} (Cost: {p.purchaseAmount})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedProduct && (() => {
                                                const prod = products.find(p => p._id === selectedProduct);
                                                if (!prod) return null;

                                                const purchasePrice = prod.purchaseAmount;
                                                const qty = Number(newProductQuantity) || 1;
                                                const salePriceStr = newProductSalePrice;
                                                const salePrice = Number(salePriceStr) || 0;
                                                const totalPurchase = purchasePrice * qty;
                                                const totalSale = salePrice * qty;
                                                const profit = salePriceStr ? (totalSale - totalPurchase) : 0;

                                                return (
                                                    <div style={{ marginBottom: '15px', fontSize: '14px', backgroundColor: '#f8f9fa', color: '#333', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span>Original Price (Per Unit):</span>
                                                            <strong>PKR {purchasePrice.toLocaleString()}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span>Total Cost ({qty} {qty > 1 ? 'units' : 'unit'}):</span>
                                                            <strong>PKR {totalPurchase.toLocaleString()}</strong>
                                                        </div>
                                                        {salePriceStr && (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px solid #dee2e6', paddingTop: '8px' }}>
                                                                    <span>Total Sale Price:</span>
                                                                    <strong>PKR {totalSale.toLocaleString()}</strong>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: profit >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                                                                    <span>Estimated Profit:</span>
                                                                    <span>PKR {profit.toLocaleString()}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="table-input"
                                                    value={newProductQuantity}
                                                    onChange={(e) => setNewProductQuantity(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Sale Price Per Unit (PKR)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="table-input"
                                                    value={newProductSalePrice}
                                                    onChange={(e) => setNewProductSalePrice(e.target.value)}
                                                    placeholder="Enter agreed price"
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label>Discount Amount (PKR)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="table-input"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    placeholder="Enter discount in PKR"
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label>Payment Type</label>
                                                <select
                                                    className="table-input"
                                                    value={paymentType}
                                                    onChange={(e) => setPaymentType(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                >
                                                    <option value="Full Payment">Full Payment</option>
                                                    <option value="Partial Payment">Partial Payment</option>
                                                </select>
                                            </div>

                                            {paymentType === 'Partial Payment' && (
                                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                                    <label>Paid Amount (PKR)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="table-input"
                                                        value={paidAmount}
                                                        onChange={(e) => setPaidAmount(e.target.value)}
                                                        placeholder="Enter paid amount"
                                                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                                    />
                                                    <div style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}>
                                                        Remaining (For this product addition): PKR {((Number(newProductSalePrice) * Number(newProductQuantity)) - (Number(discount) || 0) - (Number(paidAmount) || 0)).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            {newProductSalePrice && (
                                                <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px', marginBottom: '20px', fontWeight: 'bold', fontSize: '15px' }}>
                                                    Grand Total (For Addition): PKR {((Number(newProductSalePrice) * Number(newProductQuantity)) - (Number(discount) || 0)).toLocaleString()}
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>

                                <button className="btn btn-success btn-block" onClick={handleUpdateSubmit} disabled={updateLoading || (actionType === 'payment' && selectedInvoice.remainingAmount <= 0)}>
                                    {updateLoading ? <span className="spinner-sm" /> : 'Confirm Update'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default IncomePage;

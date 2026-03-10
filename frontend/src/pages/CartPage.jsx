import { useState } from 'react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { MdDelete, MdShoppingCartCheckout, MdClose } from 'react-icons/md';
import InvoicePrintView from '../components/InvoicePrintView';

const CartPage = () => {
    const { cartItems, updateSalePrice, removeFromCart, clearCart, cartTotal } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [clientName, setClientName] = useState('Bilal Mobile'); // Default based on image
    const [clientPhone, setClientPhone] = useState('030-748-71570'); // Default based on image
    const [discount, setDiscount] = useState('');
    const [paymentType, setPaymentType] = useState('Full Payment');
    const [paidAmount, setPaidAmount] = useState('');

    const handleOpenCheckoutModal = () => {
        const invalidItems = cartItems.filter((item) => !item.salePricePerUnit || item.salePricePerUnit <= 0);
        if (invalidItems.length > 0) {
            setError('Please enter a valid sale price for all items');
            return;
        }
        setError('');
        setShowCheckoutModal(true);
    };

    const handleCheckout = async () => {
        if (!clientName || !clientPhone) {
            setError('Client Name and Phone are required');
            return;
        }

        const totalAmount = cartTotal.totalSale;
        const discountAmt = Number(discount) || 0;

        if (discountAmt > totalAmount) {
            setError('Discount cannot exceed total amount');
            return;
        }

        const grandTotal = totalAmount - discountAmt;
        const finalPaidAmt = paymentType === 'Full Payment' ? grandTotal : (Number(paidAmount) || 0);

        if (finalPaidAmt > grandTotal) {
            setError('Paid amount cannot exceed grand total');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/sales/checkout', { items: cartItems, clientName, clientPhone, discount: discountAmt, paymentType, paidAmount: finalPaidAmt });
            setSuccess('Sale completed successfully! Invoice generated.');
            setShowCheckoutModal(false);
            clearCart();
            setDiscount('');
            setPaymentType('Full Payment');
            setPaidAmount('');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredCartItems = cartItems.filter(item =>
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Cart</h1>
                <p className="page-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Search Bar */}
            {cartItems.length > 0 && (
                <div className="search-bar-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search cart item by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="table-input"
                        style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
            )}

            {cartItems.length === 0 ? (
                <div className="empty-state">
                    <p>Your cart is empty. Go to Sales to add products.</p>
                </div>
            ) : (
                <>
                    <div className="cart-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Qty</th>
                                    <th>Purchase Price</th>
                                    <th>Sale Price (per unit)</th>
                                    <th>Total Sale</th>
                                    <th>Profit</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCartItems.map((item) => {
                                    const totalSale = item.salePricePerUnit * item.quantity;
                                    const totalPurchase = item.purchaseCostPerUnit * item.quantity;
                                    const profit = totalSale - totalPurchase;
                                    return (
                                        <tr key={item.productId}>
                                            <td className="fw-600">{item.productName}</td>
                                            <td><span className="table-badge">{item.productType}</span></td>
                                            <td>{item.quantity}</td>
                                            <td>PKR {item.purchaseCostPerUnit.toLocaleString()}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="table-input"
                                                    value={item.salePricePerUnit || ''}
                                                    onChange={(e) => updateSalePrice(item.productId, e.target.value)}
                                                    placeholder="Enter price"
                                                />
                                            </td>
                                            <td>PKR {totalSale.toLocaleString()}</td>
                                            <td className={profit >= 0 ? 'text-success' : 'text-danger'}>
                                                PKR {profit.toLocaleString()}
                                            </td>
                                            <td>
                                                <button className="btn btn-danger btn-icon" onClick={() => removeFromCart(item.productId)}>
                                                    <MdDelete />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="cart-summary">
                        <div className="summary-card">
                            <div className="summary-row">
                                <span>Total Purchase Cost</span>
                                <span className="summary-value">PKR {cartTotal.totalPurchase.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Sale</span>
                                <span className="summary-value">PKR {cartTotal.totalSale.toLocaleString()}</span>
                            </div>
                            <div className="summary-row summary-profit">
                                <span>Total Profit</span>
                                <span className={`summary-value ${cartTotal.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                    PKR {cartTotal.totalProfit.toLocaleString()}
                                </span>
                            </div>
                            <button className="btn btn-primary btn-block" onClick={handleOpenCheckoutModal} disabled={loading || cartItems.length === 0}>
                                <MdShoppingCartCheckout /> Checkout
                            </button>
                        </div>
                    </div>

                    {showCheckoutModal && (
                        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div className="modal-content" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0 }}>Client Details</h2>
                                    <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                                        <MdClose />
                                    </button>
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Client Name</label>
                                    <input
                                        type="text"
                                        className="table-input"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Enter client name"
                                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label>Client Phone Number</label>
                                    <input
                                        type="text"
                                        className="table-input"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        placeholder="Enter client phone"
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
                                            Remaining: PKR {(cartTotal.totalSale - (Number(discount) || 0) - (Number(paidAmount) || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
                                    Grand Total: PKR {(cartTotal.totalSale - (Number(discount) || 0)).toLocaleString()}
                                </div>

                                <button className="btn btn-success btn-block" onClick={handleCheckout} disabled={loading}>
                                    {loading ? <span className="spinner-sm" /> : 'Generate Invoice & Checkout'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CartPage;

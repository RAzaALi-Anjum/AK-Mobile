import { useState } from 'react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { MdDelete, MdShoppingCartCheckout } from 'react-icons/md';

const CartPage = () => {
    const { cartItems, updateSalePrice, removeFromCart, clearCart, cartTotal } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleCheckout = async () => {
        // Validate all sale prices
        const invalidItems = cartItems.filter((item) => !item.salePricePerUnit || item.salePricePerUnit <= 0);
        if (invalidItems.length > 0) {
            setError('Please enter a valid sale price for all items');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/sales/checkout', { items: cartItems });
            setSuccess('Sale completed successfully!');
            clearCart();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Cart</h1>
                <p className="page-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

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
                                {cartItems.map((item) => {
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
                            <button className="btn btn-primary btn-block" onClick={handleCheckout} disabled={loading}>
                                {loading ? <span className="spinner-sm" /> : <><MdShoppingCartCheckout /> Save Sale</>}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage;

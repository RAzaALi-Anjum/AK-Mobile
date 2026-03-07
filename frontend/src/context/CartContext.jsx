import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product, quantity) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.productId === product._id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [
                ...prev,
                {
                    productId: product._id,
                    productName: product.productName,
                    productType: product.productType,
                    quantity,
                    purchaseCostPerUnit: product.purchaseAmount,
                    salePricePerUnit: 0,
                    maxQuantity: product.quantity,
                },
            ];
        });
    };

    const updateSalePrice = (productId, salePrice) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, salePricePerUnit: Number(salePrice) }
                    : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce(
        (acc, item) => {
            const totalSale = item.salePricePerUnit * item.quantity;
            const totalPurchase = item.purchaseCostPerUnit * item.quantity;
            return {
                totalSale: acc.totalSale + totalSale,
                totalPurchase: acc.totalPurchase + totalPurchase,
                totalProfit: acc.totalProfit + (totalSale - totalPurchase),
            };
        },
        { totalSale: 0, totalPurchase: 0, totalProfit: 0 }
    );

    return (
        <CartContext.Provider
            value={{ cartItems, addToCart, updateSalePrice, removeFromCart, clearCart, cartTotal }}
        >
            {children}
        </CartContext.Provider>
    );
};

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import AddProductPage from './pages/AddProductPage';
import ViewProductsPage from './pages/ViewProductsPage';
import SalesPage from './pages/SalesPage';
import CartPage from './pages/CartPage';
import IncomePage from './pages/IncomePage';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="products/add" element={<AddProductPage />} />
                            <Route path="products/view" element={<ViewProductsPage />} />
                            <Route path="sales" element={<SalesPage />} />
                            <Route path="cart" element={<CartPage />} />
                            <Route path="income" element={<IncomePage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;

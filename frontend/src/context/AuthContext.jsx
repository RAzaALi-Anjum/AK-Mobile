import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('ak_token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAdmin = async () => {
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setAdmin(data);
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };
        loadAdmin();
    }, [token]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('ak_token', data.token);
        localStorage.setItem('ak_admin', JSON.stringify({ name: data.name, email: data.email }));
        setToken(data.token);
        setAdmin({ name: data.name, email: data.email, _id: data._id });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('ak_token');
        localStorage.removeItem('ak_admin');
        setToken(null);
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, token, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

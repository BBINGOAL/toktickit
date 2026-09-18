import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { login as apiLogin, changePassword as apiChangePassword } from '../api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Change password state
    const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [tempUser, setTempUser] = useState<User | null>(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            setLoading(true);
            const data = await apiLogin({ email, password });
            
            if (data.mustChangePassword) {
                setTempUser(data);
                setNeedsPasswordChange(true);
            } else {
                setUser(data);
                if (data.role === 'IT_STAFF' || data.role === 'ADMIN') {
                    navigate('/staff/tickets');
                } else {
                    navigate('/tickets');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            setLoading(true);
            await apiChangePassword(newPassword);
            
            if (tempUser) {
                const finalUser = { ...tempUser, mustChangePassword: false };
                setUser(finalUser);
                if (finalUser.role === 'IT_STAFF' || finalUser.role === 'ADMIN') {
                    navigate('/staff/tickets');
                } else {
                    navigate('/tickets');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>TokTickIT</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {needsPasswordChange ? 'Force Change Password' : 'Sign in to your account'}
                    </p>
                </div>

                {error && (
                    <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '14px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                {!needsPasswordChange ? (
                    <form onSubmit={handleLoginSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@kmutt.ac.th"
                                autoComplete="email"
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#006B3C',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '15px',
                                fontWeight: 500,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleChangePasswordSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '14px', color: '#d97706', marginBottom: '16px', backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px' }}>
                                For security reasons, you must change your password before continuing.
                            </p>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#006B3C',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '15px',
                                fontWeight: 500,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Saving...' : 'Set Password and Login'}
                        </button>
                    </form>
                )}

                {!needsPasswordChange && (
                    <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Demo Accounts:</p>
                        <p style={{ margin: '2px 0' }}>jennifer.anderson@kmutt.ac.th</p>
                        <p style={{ margin: '2px 0' }}>it1@kmutt.ac.th</p>
                        <p style={{ margin: '2px 0' }}>admin@kmutt.ac.th</p>
                        <p style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>Password: password123</p>
                    </div>
                )}
            </div>
        </div>
    );
}

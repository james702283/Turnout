import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import { Megaphone } from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register(email, password, address);
            navigate('/login');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 bg-grid flex items-center justify-center py-12">
            <div className="w-full max-w-md mx-auto p-8">
                <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-6">
                        <Megaphone className="w-12 h-12 text-cyan-400 mb-4" />
                        <h1 className="text-3xl font-bold text-white tracking-tight">Create Your Account</h1>
                        <p className="text-slate-400">Join the movement and stay informed.</p>
                    </div>

                    {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                        </div>
                        
                        <hr className="my-6 border-slate-700" />

                        <p className="text-slate-300 mb-2 font-medium text-sm">Your Location</p>
                        <div className="mb-4">
                            <label htmlFor="street" className="block text-xs font-medium text-slate-400 mb-1">Street Address</label>
                            <input type="text" id="street" name="street" value={address.street} onChange={handleAddressChange} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                        </div>
                        <div className="flex gap-4 mb-4">
                            <div className="flex-grow">
                                <label htmlFor="city" className="block text-xs font-medium text-slate-400 mb-1">City</label>
                                <input type="text" id="city" name="city" value={address.city} onChange={handleAddressChange} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                            </div>
                            <div>
                                <label htmlFor="state" className="block text-xs font-medium text-slate-400 mb-1">State</label>
                                <input type="text" id="state" name="state" value={address.state} onChange={handleAddressChange} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="zip" className="block text-xs font-medium text-slate-400 mb-1">ZIP Code</label>
                            <input type="text" id="zip" name="zip" value={address.zip} onChange={handleAddressChange} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg hover:bg-cyan-400 transition flex items-center justify-center disabled:bg-slate-600">
                            {loading && <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>}
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="text-center text-slate-400 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
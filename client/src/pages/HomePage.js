import React from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-slate-900 text-white bg-grid font-sans">
            {/* Header */}
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Megaphone className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-2xl font-bold ml-3">Turnout</h1>
                </div>
                <nav className="flex items-center gap-4">
                    <Link to="/login" className="text-slate-300 hover:text-white font-semibold transition">Log In</Link>
                    <Link to="/register" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                        Sign Up
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-24 text-center">
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Your Voice, Amplified.
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300">
                    Turnout is the modern platform for civic engagement. We cut through the noise to bring you personalized, actionable information about the proposals, events, and representatives that shape your community.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Link to="/register" className="bg-white text-slate-900 font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-200 transition-transform transform hover:scale-105 flex items-center">
                        Get Started <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-slate-900/50 py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h3 className="text-4xl font-bold">Why Turnout?</h3>
                        <p className="text-slate-400 mt-2">Transforming civic data into civic action.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h4 className="text-xl font-bold">Stay Informed</h4>
                            <p className="text-slate-400 mt-2">Get personalized updates on local proposals and town hall meetings that matter to you.</p>
                        </div>
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h4 className="text-xl font-bold">Know Your Reps</h4>
                            <p className="text-slate-400 mt-2">Instantly see who represents you at every level of government, from local to federal.</p>
                        </div>
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h4 className="text-xl font-bold">Make an Impact</h4>
                            <p className="text-slate-400 mt-2">Support community-driven proposals and hold your elected officials accountable.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
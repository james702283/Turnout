import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Megaphone, Users, Building, Mic, ShieldCheck, Calendar, MapPin, PlusCircle, X, Filter } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// A generic loading spinner to be used while auth is loading
const AuthLoadingSpinner = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-dashed rounded-full animate-spin"></div>
    </div>
);

const CreateProposalModal = ({ onClose, onProposalCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post(`${API_BASE_URL}/api/proposals`, {
                title,
                description,
                category,
                creatorId: user.id
            });
            onProposalCreated();
        } catch (err) {
            setError(err.message || 'Failed to create proposal.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-white/10 rounded-xl p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold text-white mb-4">Create a New Proposal</h2>
                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                            <option value="general">General</option>
                            <option value="infrastructure">Infrastructure</option>
                            <option value="community">Community</option>
                            <option value="policy">Policy</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg hover:bg-cyan-400 transition disabled:bg-slate-600">
                        {loading ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user, logout, loading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('official-events');
    const [proposals, setProposals] = useState([]);
    const [communityEvents, setCommunityEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = useCallback(async (filterStartDate, filterEndDate) => {
        setIsLoading(true);
        setError(null);
        try {
            const eventParams = new URLSearchParams();
            if (filterStartDate) eventParams.append('startDate', filterStartDate);
            if (filterEndDate) eventParams.append('endDate', filterEndDate);
            const eventQuery = eventParams.toString();

            const [proposalsData, eventsData] = await Promise.all([
                api.get(`${API_BASE_URL}/api/proposals`),
                api.get(`${API_BASE_URL}/api/openstates/events?${eventQuery}`)
            ]);
            setProposals(proposalsData);
            setCommunityEvents(eventsData.results || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthLoading) return; // Wait for auth to finish
        if (!user) {
            navigate('/login');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        fetchData(today, null);
    }, [user, isAuthLoading, fetchData, refetchTrigger, navigate]);
    
    const handleProposalCreated = () => {
        setIsModalOpen(false);
        setRefetchTrigger(prev => prev + 1);
    };

    const handleFilter = () => {
        fetchData(startDate, endDate);
    };

    if (isAuthLoading) {
        return <AuthLoadingSpinner />;
    }

    const renderTabContent = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <ErrorDisplay message={error} />;
        switch (activeTab) {
            case 'proposals': return <ProposalList proposals={proposals} onAddProposal={() => setIsModalOpen(true)} />;
            case 'official-events': 
                return (
                    <div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-900/50 p-4 rounded-lg mb-6 border border-white/10">
                            <div className="flex-grow w-full">
                                <label htmlFor="start-date" className="text-sm font-medium text-slate-300">Start Date</label>
                                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
                            </div>
                            <div className="flex-grow w-full">
                                <label htmlFor="end-date" className="text-sm font-medium text-slate-300">End Date</label>
                                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
                            </div>
                            <button onClick={handleFilter} className="w-full sm:w-auto mt-4 sm:mt-0 self-end py-2 px-4 bg-cyan-500 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-400 transition">
                                <Filter size={18} /> Filter
                            </button>
                        </div>
                        <CommunityEventList events={communityEvents} />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <>
            {isModalOpen && <CreateProposalModal onClose={() => setIsModalOpen(false)} onProposalCreated={handleProposalCreated} />}
            <div className="min-h-screen bg-slate-900 font-sans text-slate-200 bg-grid">
                <div className="container mx-auto px-4 py-8">
                    <Header onLogout={logout} />
                    <main className="mt-8">
                        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                        <div className="bg-slate-800/20 backdrop-blur-lg rounded-b-xl p-4 sm:p-6 lg:p-8 border border-white/10">
                            {renderTabContent()}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

function Header({ onLogout }) {
    return (
        <header className="bg-slate-800/20 backdrop-blur-lg p-4 sm:p-6 rounded-xl border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                    <Megaphone className="w-10 h-10 text-cyan-400" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white/90 ml-4 tracking-tight">Turnout</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onLogout} className="font-semibold text-slate-300 hover:text-white transition">Logout</button>
                </div>
            </div>
        </header>
    );
}
function Tabs({ activeTab, setActiveTab }) {
    const Tab = ({ name, id, icon }) => (
        <button onClick={() => setActiveTab(id)} className={`flex-1 py-3 px-2 font-bold text-sm sm:text-base border-b-2 transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === id ? 'text-cyan-400 border-cyan-400' : 'text-slate-400 border-transparent hover:text-white hover:border-slate-500'}`}>
            {icon} {name}
        </button>
    );
    return (
        <div className="flex bg-slate-900/50 rounded-t-xl border-x border-t border-white/10">
            <Link to="/my-representatives" className="flex-1 py-3 px-2 font-bold text-sm sm:text-base border-b-2 transition-all duration-300 flex items-center justify-center gap-2 text-slate-400 border-transparent hover:text-white hover:border-slate-500"><ShieldCheck size={18}/> My Representatives</Link>
            <Tab id="official-events" name="Community Events" icon={<Mic size={18}/>} />
            <Tab id="proposals" name="Proposals" icon={<Building size={18}/>} />
        </div>
    );
}

const ProposalList = ({ proposals, onAddProposal }) => {
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onAddProposal} className="bg-cyan-500 text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-cyan-400 transition">
                    <PlusCircle size={18} /> Create Proposal
                </button>
            </div>
            {(!proposals || proposals.length === 0) 
                ? <EmptyState type="proposal" /> 
                : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{proposals.map(p => <ProposalCard key={p._id} proposal={p} />)}</div>
            }
        </div>
    );
};

const ProposalCard = ({ proposal }) => {
    const { title, description, category, supporterCount = 0 } = proposal;
    return (
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6 flex flex-col">
            <div className="flex-grow">
                <span className="inline-block bg-cyan-400/10 text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 capitalize">{category}</span>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">{description}</p>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center"><Users className="w-5 h-5 text-slate-400 mr-2"/><span className="text-lg font-bold text-white">{supporterCount}</span><span className="text-sm text-slate-400 ml-1.5">supporters</span></div>
            </div>
        </div>
    );
};

const CommunityEventList = ({ events }) => {
    if (!events || events.length === 0) return <EmptyState type="event" />;
    return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{events.map(e => <CommunityEventCard key={e._id} event={e} />)}</div>;
};

const CommunityEventCard = ({ event }) => {
    const eventDate = event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Date not specified';
    const locationName = event.locationName || 'See Details';
    const classification = event.classification || 'General';

    return (
        <Link to={`/event/${event._id}`} className="group bg-slate-800/50 p-6 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-slate-800 transition-all duration-300 flex flex-col">
            <span className="inline-block text-xs font-bold mr-2 px-2.5 py-1 rounded-full mb-4 w-fit bg-blue-400/10 text-blue-400 capitalize">{classification.replace(/_/g, ' ')}</span>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-3 group-hover:text-cyan-300">{event.name || 'Untitled Event'}</h3>
            <div className="flex items-center text-slate-300 text-sm mb-2 mt-auto pt-4">
                <Calendar className="w-4 h-4 mr-2.5 text-slate-400 flex-shrink-0" /> {eventDate}
            </div>
            <div className="flex items-center text-slate-300 text-sm">
                <MapPin className="w-4 h-4 mr-2.5 text-slate-400 flex-shrink-0" /> {locationName}
            </div>
        </Link>
    );
};

const LoadingSpinner = () => <div className="text-center p-10"><div className="w-12 h-12 border-4 border-cyan-400 border-dashed rounded-full animate-spin mx-auto"></div><p className="mt-4 text-lg text-slate-400">Loading...</p></div>;

const EmptyState = ({ type }) => {
    const content = {
        proposal: { icon: <Building/>, title: "No Proposals Yet", message: "Click the button above to create the first proposal and start a movement." },
        event: { icon: <Mic/>, title: "No Upcoming Community Events", message: "No community events were found for your area. Try running the ingestion process or adjusting the date filter." }
    };
    const current = content[type];
    return (
        <div className="text-center py-16 px-6">
            <div className="w-16 h-16 mx-auto text-slate-500 bg-slate-900/50 rounded-full flex items-center justify-center">
                {React.cloneElement(current.icon, { size: 32 })}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">{current.title}</h2>
            <p className="mt-2 text-slate-400">{current.message}</p>
        </div>
    );
};

const ErrorDisplay = ({ message }) => <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg" role="alert"><p className="font-bold">An Error Occurred</p><p>{message}</p></div>;
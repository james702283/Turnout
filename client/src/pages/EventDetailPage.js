import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Megaphone, Calendar, MapPin, ExternalLink, PlusCircle } from 'lucide-react';
import api from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function EventDetailPage() {
    const { id: eventId } = useParams();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!eventId || !user) return;
        const fetchEventDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.get(`${API_BASE_URL}/api/openstates/events/${eventId}`);
                setEvent(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId, user]);

    const renderContent = () => {
        if (isLoading) return <div className="text-center p-10"><div className="w-12 h-12 border-4 border-cyan-400 border-dashed rounded-full animate-spin mx-auto"></div><p className="mt-4 text-lg text-slate-400">Loading Event Details...</p></div>;
        if (error) return <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">{error}</div>;
        if (!event) return <div className="text-center py-12"><h3 className="text-2xl font-bold text-white">Event Not Found</h3></div>;

        // --- FIX: Use the stable 'start_date' field from the normalized API response ---
        const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Date not specified';

        return (
            <div>
                <span className="inline-block bg-blue-400/10 text-blue-400 text-sm font-semibold px-3 py-1 rounded-full mb-4 capitalize">{event.classification}</span>
                <h2 className="text-3xl font-bold text-white">{event.name}</h2>
                
                {/* This top-level description acts as a subtitle */}
                <p className="text-slate-400 mt-2">{event.description}</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-slate-300">
                    <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" /> {eventDate}
                    </div>
                    <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                        {/* --- NEW: Clickable Google Maps Link --- */}
                        {event.googleMapsUrl ? (
                            <a href={event.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                                {event.location.name}
                            </a>
                        ) : (
                            <span>{event.location.name}</span>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    {/* --- NEW: Add to Calendar Button --- */}
                    {event.calendarLinks?.google && (
                        <a href={event.calendarLinks.google} target="_blank" rel="noopener noreferrer" className="bg-cyan-500/10 text-cyan-400 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-colors">
                            <PlusCircle size={18} /> Add to Google Calendar
                        </a>
                    )}
                    {event.sources?.[0]?.url && (
                         <a href={event.sources[0].url} target="_blank" rel="noopener noreferrer" className="bg-slate-700/50 text-slate-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                            <ExternalLink className="w-4 h-4" /> View Original Source
                        </a>
                    )}
                </div>

                <hr className="my-8 border-slate-700" />

                <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Agenda</h3>
                    {/* --- FIX: The full description is now correctly rendered as the agenda --- */}
                    {event.agenda && event.agenda.length > 0 ? (
                        <ul className="space-y-4">
                            {event.agenda.map((item, index) => (
                                <li key={index} className="bg-slate-800/50 p-4 rounded-lg">
                                    <p className="text-white">{item.description}</p>
                                    {item.subjects?.length > 0 && <p className="text-sm text-cyan-400 mt-1">{item.subjects.join(', ')}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400">No agenda has been published for this event.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-200 bg-grid">
            <div className="container mx-auto px-4 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center">
                        <Megaphone className="w-10 h-10 text-cyan-400" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white/90 ml-4 tracking-tight">Turnout</h1>
                    </div>
                    <Link to="/dashboard" className="flex items-center font-semibold text-slate-300 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
                    </Link>
                </header>
                <main className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white/10">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
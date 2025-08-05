import React from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to get a clean, human-readable division type
const getDivisionType = (ocdId) => {
    const parts = ocdId.split('/');
    const lastPart = parts[parts.length - 1];
    const [type] = lastPart.split(':');

    switch (type) {
        case 'country': return 'Country';
        case 'state': return 'State';
        case 'county': return 'County';
        case 'place': return 'City / Municipality';
        case 'council_district': return 'Council District';
        case 'cd': return 'Congressional District';
        case 'sldu': return 'State Senate District';
        case 'sldl': return 'State Assembly District';
        case 'supreme_court': return 'Supreme Court District';
        default: return type.replace(/_/g, ' '); // Best guess fallback
    }
};

export default function CivicInfoDisplay({ civicInfo, isLoading }) {
    if (isLoading) {
        return (
            <div className="text-center p-10">
                <div className="w-12 h-12 border-4 border-cyan-400 border-dashed rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg text-slate-400">Fetching Your Civic Data...</p>
            </div>
        );
    }

    if (!civicInfo || !civicInfo.divisions || civicInfo.divisions.length === 0) {
        return (
            <div className="text-center py-16 px-6">
                <Landmark className="w-16 h-16 mx-auto text-slate-500" />
                <h2 className="mt-4 text-2xl font-bold text-white">No Civic Info Found</h2>
                <p className="mt-2 text-slate-400">We could not retrieve civic information for the address in your profile.</p>
            </div>
        );
    }

    const { divisions, normalizedInput } = civicInfo;

    return (
        <div>
            <div className="mb-8 p-4 bg-slate-900/50 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white">Showing results for:</h3>
                <p className="text-slate-300">{normalizedInput.line1}, {normalizedInput.city}, {normalizedInput.state} {normalizedInput.zip}</p>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">Your Political Divisions</h3>
            <p className="text-slate-400 mb-6 max-w-2xl">These are the districts that represent you, ranked by local impact. Click on any division to learn more about who represents you.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {divisions.map((division) => (
                    <Link 
                        to={`/division/${encodeURIComponent(division.ocdId)}`} 
                        key={division.ocdId} 
                        className="group bg-slate-800/50 p-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-slate-800 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <p className="font-bold text-cyan-400 text-sm capitalize" title={division.ocdId}>
                                {getDivisionType(division.ocdId)}
                            </p>
                            <p className="text-lg text-white mt-1">{division.name}</p>
                        </div>
                        <div className="flex justify-end items-center mt-4">
                            <span className="text-sm font-semibold text-slate-400 group-hover:text-cyan-300">View Details</span>
                            <ArrowRight className="w-4 h-4 ml-2 text-slate-400 group-hover:text-cyan-300 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
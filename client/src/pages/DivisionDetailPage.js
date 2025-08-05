import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Megaphone, User, Mail, Phone, Globe } from 'lucide-react';
import api from '../utils/api'; // NEW IMPORT

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const GET_REPS_QUERY = `
    query getRepresentatives($jurisdiction: String!) {
      people(jurisdiction: $jurisdiction, first: 10) {
        edges {
          node {
            id
            name
            image
            party: currentMemberships(classification: "party") {
              organization {
                name
              }
            }
            role: currentMemberships {
              post {
                label
              }
            }
            contactDetails {
              type
              value
              note
            }
            links {
              url
              note
            }
          }
        }
      }
    }
`;

export default function DivisionDetailPage() {
    const { ocdId: encodedOcdId } = useParams();
    const ocdId = decodeURIComponent(encodedOcdId);
    const { user } = useAuth();
    const [representatives, setRepresentatives] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const divisionName = ocdId.split('/').pop().replace(/_/g, ' ').split(':').pop();

    useEffect(() => {
        if (!ocdId || !user) return;

        const fetchReps = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.post(`${API_BASE_URL}/api/openstates/query`, {
                    query: GET_REPS_QUERY,
                    variables: { jurisdiction: ocdId }
                });
                if (data.errors) throw new Error(data.errors[0].message);
                setRepresentatives(data.data.people.edges.map(edge => edge.node));
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReps();
    }, [ocdId, user]);

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-10"><div className="w-12 h-12 border-4 border-cyan-400 border-dashed rounded-full animate-spin mx-auto"></div><p className="mt-4 text-lg text-slate-400">Fetching Representative Data...</p></div>;
        }
        if (error) {
            return <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">{error}</div>;
        }
        if (representatives.length > 0) {
            return <div className="space-y-6">{representatives.map((rep) => <RepresentativeCard key={rep.id} official={rep} />)}</div>;
        }
        return <div className="text-center py-12"><h3 className="text-2xl font-bold text-white">No Official Data Available</h3><p className="text-slate-400 mt-2">No representative information could be found for this division in the Open States database.</p></div>;
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-200 bg-grid">
            <div className="container mx-auto px-4 py-8">
                <header className="flex justify-between items-center mb-8">
                     <div className="flex items-center">
                        <Megaphone className="w-10 h-10 text-cyan-400" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white/90 ml-4 tracking-tight">Turnout</h1>
                    </div>
                    <Link to="/dashboard" className="flex items-center font-semibold text-slate-300 hover:text-white transition"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
                </header>
                <main className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white/10">
                    <h2 className="text-3xl font-bold text-white capitalize">Officials For: {divisionName}</h2>
                    <p className="text-cyan-400 mt-1 text-sm break-all">{ocdId}</p>
                    <hr className="my-6 border-slate-700" />
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

const RepresentativeCard = ({ official }) => {
    const party = official.party[0]?.organization?.name || 'Unknown';
    const partyColor = party.includes('Democratic') ? 'text-blue-400' : party.includes('Republican') ? 'text-red-400' : 'text-gray-400';
    const role = official.role[0]?.post?.label || 'Representative';
    const email = official.contactDetails.find(c => c.type === 'email')?.value;
    const phone = official.contactDetails.find(c => c.type === 'voice')?.value;
    const website = official.links.find(l => l.note === 'homepage')?.url;

    return (
        <div className="bg-slate-800/50 rounded-lg border border-white/10 p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-shrink-0">
                {official.image ? <img src={official.image} alt={official.name} className="w-24 h-24 rounded-full object-cover bg-slate-700" /> : <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center"><User className="w-12 h-12 text-slate-500" /></div>}
            </div>
            <div className="flex-grow text-center sm:text-left">
                <h4 className="text-xl font-bold text-white">{official.name}</h4>
                <p className={`font-semibold ${partyColor}`}>{party}</p>
                <p className="text-slate-300">{role}</p>
                <div className="mt-3 flex justify-center sm:justify-start flex-wrap gap-x-4 gap-y-1 text-sm">
                    {email && <InfoItem icon={<Mail size={16} />} href={`mailto:${email}`} text="Email" />}
                    {phone && <InfoItem icon={<Phone size={16} />} href={`tel:${phone}`} text={phone} />}
                    {website && <InfoItem icon={<Globe size={16} />} href={website} text="Website" />}
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, href, text }) => {
    if (!text) return null;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors duration-200"><div className="text-slate-400 flex-shrink-0">{icon}</div><span className="truncate">{text}</span></a>;
};
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, deleteDoc, onSnapshot, getDoc, writeBatch, query } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Trophy, Users, BarChart2, Calendar, RefreshCw, Edit, Check, X, MapPin } from 'lucide-react';

// --- Firebase Configuration ---
// These global variables are provided by the environment.
const firebaseConfig = {
  apiKey: "AIzaSyDfFKO61XlEZ6o-g0N1UKl9pi4t-Urmzmc",
  authDomain: "esportemuz-v1.firebaseapp.com",
  projectId: "esportemuz-v1",
  storageBucket: "esportemuz-v1.firebasestorage.app",
  messagingSenderId: "833982399842",
  appId: "1:833982399842:web:4f5c8de14f26ef76ef583b",
  measurementId: "G-NB9Z105VVV"
};
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-championship-manager';
const appId = 'default-championship-manager';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const getDbPath = (path) => `/artifacts/${appId}/public/data/${path}`;

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('championships'); // 'teams', 'venues', 'championships', 'view_championship', 'create_championship', 'edit_championship'
    const [selectedChampionshipId, setSelectedChampionshipId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const navigateTo = (newView, championshipId = null) => {
        setView(newView);
        setSelectedChampionshipId(championshipId);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><RefreshCw className="animate-spin mr-2" /> Carregando...</div>;
    }
    
    if (!user) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Autenticando...</div>;
    }

    const renderContent = () => {
        switch (view) {
            case 'teams':
                return <TeamManagement back={() => navigateTo('championships')} />;
            case 'venues':
                 return <VenueManagement back={() => navigateTo('championships')} />;
            case 'championships':
                return <ChampionshipList navigateTo={navigateTo} />;
            case 'create_championship':
                return <ChampionshipCreator back={() => navigateTo('championships')} onCreated={(id) => navigateTo('view_championship', id)} />;
            case 'edit_championship':
                return <ChampionshipEditor championshipId={selectedChampionshipId} back={() => navigateTo('championships')} onUpdated={(id) => navigateTo('view_championship', id)} />;
            case 'view_championship':
                return <ChampionshipView championshipId={selectedChampionshipId} back={() => navigateTo('championships')} />;
            default:
                return <ChampionshipList navigateTo={navigateTo} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-6">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h1 className="text-3xl font-bold text-teal-400 mb-2 sm:mb-0 flex items-center">
                        <Trophy className="mr-3" /> Gerenciador de Campeonatos
                    </h1>
                    <nav className="flex items-center space-x-2">
                        <button onClick={() => navigateTo('championships')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view.includes('championship') ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <Trophy className="w-4 h-4 mr-2" /> Campeonatos
                        </button>
                        <button onClick={() => navigateTo('teams')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view === 'teams' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <Users className="w-4 h-4 mr-2" /> Times
                        </button>
                         <button onClick={() => navigateTo('venues')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view === 'venues' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <MapPin className="w-4 h-4 mr-2" /> Locais
                        </button>
                    </nav>
                </header>
                <main>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

// --- Venue Management Component ---
function VenueManagement({ back }) {
    const [venues, setVenues] = useState([]);
    const [venueName, setVenueName] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingVenue, setEditingVenue] = useState(null);

    useEffect(() => {
        const venuesRef = collection(db, getDbPath('venues'));
        const unsubscribe = onSnapshot(query(venuesRef), (snapshot) => {
            const venuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name));
            setVenues(venuesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddVenue = async (e) => {
        e.preventDefault();
        if (venueName.trim() === '') return;
        try {
            await addDoc(collection(db, getDbPath('venues')), { name: venueName.trim() });
            setVenueName('');
        } catch (error) {
            console.error("Error adding venue:", error);
        }
    };

    const handleDeleteVenue = async (venueId) => {
        try {
            await deleteDoc(doc(db, getDbPath(`venues/${venueId}`)));
        } catch (error) {
            console.error("Error deleting venue:", error);
        }
    };

    const handleStartEdit = (venue) => setEditingVenue({ ...venue });
    const handleCancelEdit = () => setEditingVenue(null);

    const handleUpdateVenue = async () => {
        if (!editingVenue || editingVenue.name.trim() === '') return;
        const venueRef = doc(db, getDbPath(`venues/${editingVenue.id}`));
        try {
            await setDoc(venueRef, { name: editingVenue.name.trim() }, { merge: true });
            setEditingVenue(null);
        } catch (error) {
            console.error("Error updating venue:", error);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <button onClick={back} className="flex items-center text-teal-400 hover:text-teal-300 mb-4 font-semibold">
                <ArrowLeft className="mr-2" /> Voltar
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center"><MapPin className="mr-2"/>Gerenciar Locais</h2>
            <form onSubmit={handleAddVenue} className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Nome do novo local"
                    className="flex-grow bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:border-teal-500 transition"
                />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition">
                    <Plus className="mr-2" /> Adicionar Local
                </button>
            </form>
            {loading ? <p>Carregando locais...</p> : (
                <div className="space-y-3">
                    {venues.map(venue => (
                        <div key={venue.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                            {editingVenue && editingVenue.id === venue.id ? (
                                <>
                                    <input type="text" value={editingVenue.name} onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })} className="flex-grow bg-gray-800 text-white p-2 rounded-lg border-2 border-teal-500 focus:outline-none" autoFocus />
                                    <div className="flex items-center ml-2 space-x-1">
                                        <button onClick={handleUpdateVenue} className="text-green-400 hover:text-green-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Check size={20} /></button>
                                        <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><X size={20} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold">{venue.name}</span>
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => handleStartEdit(venue)} className="text-yellow-400 hover:text-yellow-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteVenue(venue.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Trash2 size={18} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// --- Team Management Component ---
function TeamManagement({ back }) {
    const [teams, setTeams] = useState([]);
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingTeam, setEditingTeam] = useState(null);

    useEffect(() => {
        const teamsRef = collection(db, getDbPath('teams'));
        const unsubscribe = onSnapshot(query(teamsRef), (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name));
            setTeams(teamsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (teamName.trim() === '') return;
        try {
            await addDoc(collection(db, getDbPath('teams')), { name: teamName.trim() });
            setTeamName('');
        } catch (error) {
            console.error("Error adding team:", error);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        try {
            await deleteDoc(doc(db, getDbPath(`teams/${teamId}`)));
        } catch (error) {
            console.error("Error deleting team:", error);
        }
    };
    
    const handleStartEdit = (team) => {
        setEditingTeam({ ...team });
    };

    const handleCancelEdit = () => {
        setEditingTeam(null);
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam || editingTeam.name.trim() === '') return;
        const teamRef = doc(db, getDbPath(`teams/${editingTeam.id}`));
        try {
            await setDoc(teamRef, { name: editingTeam.name.trim() }, { merge: true });
            setEditingTeam(null);
        } catch (error) {
            console.error("Error updating team:", error);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <button onClick={back} className="flex items-center text-teal-400 hover:text-teal-300 mb-4 font-semibold">
                <ArrowLeft className="mr-2" /> Voltar
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center"><Users className="mr-2"/>Gerenciar Times</h2>
            <form onSubmit={handleAddTeam} className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nome do novo time"
                    className="flex-grow bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:border-teal-500 transition"
                />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition">
                    <Plus className="mr-2" /> Adicionar Time
                </button>
            </form>
            {loading ? (
                <p>Carregando times...</p>
            ) : (
                <div className="space-y-3">
                    {teams.map(team => (
                        <div key={team.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                            {editingTeam && editingTeam.id === team.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editingTeam.name}
                                        onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                        className="flex-grow bg-gray-800 text-white p-2 rounded-lg border-2 border-teal-500 focus:outline-none"
                                        autoFocus
                                    />
                                    <div className="flex items-center ml-2 space-x-1">
                                        <button onClick={handleUpdateTeam} className="text-green-400 hover:text-green-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Check size={20} /></button>
                                        <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><X size={20} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold">{team.name}</span>
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => handleStartEdit(team)} className="text-yellow-400 hover:text-yellow-300 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-gray-800 hover:bg-gray-600 transition"><Trash2 size={18} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Championship List Component ---
function ChampionshipList({ navigateTo }) {
    const [championships, setChampionships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const championshipsRef = collection(db, getDbPath('championships'));
        const unsubscribe = onSnapshot(query(championshipsRef), (snapshot) => {
            const champsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name));
            setChampionships(champsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleDeleteChampionship = async (champId) => {
        try {
            const batch = writeBatch(db);
            const matchesRef = collection(db, getDbPath(`championships/${champId}/matches`));
            const matchesSnapshot = await getDocs(matchesRef);
            matchesSnapshot.forEach((matchDoc) => {
                batch.delete(matchDoc.ref);
            });
            const champRef = doc(db, getDbPath(`championships/${champId}`));
            batch.delete(champRef);
            await batch.commit();
        } catch (error) {
            console.error("Error deleting championship:", error);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center"><Trophy className="mr-2"/>Campeonatos</h2>
                <button onClick={() => navigateTo('create_championship')} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition">
                    <Plus className="mr-2" /> Criar Novo
                </button>
            </div>
            {loading ? (
                <p>Carregando campeonatos...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {championships.length > 0 ? (
                        championships.map(champ => (
                            <div key={champ.id} className="bg-gray-700 rounded-lg flex flex-col justify-between shadow-md hover:shadow-xl transition-shadow duration-300">
                                <div className="p-4 cursor-pointer" onClick={() => navigateTo('view_championship', champ.id)}>
                                    <h3 className="font-bold text-lg text-teal-400 truncate">{champ.name}</h3>
                                    <p className="text-sm text-gray-300 capitalize">{champ.sport}</p>
                                    <p className="text-xs text-gray-400 mt-1">{champ.format === 'league' ? 'Pontos Corridos' : 'Grupos + Mata-Mata'}</p>
                                    <div className="flex items-center text-xs text-gray-400 mt-3">
                                        <Users className="w-4 h-4 mr-1" /> {champ.teams.length} times
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 p-2 flex justify-end space-x-2 rounded-b-lg">
                                    <button onClick={(e) => {e.stopPropagation(); navigateTo('edit_championship', champ.id)}} className="text-yellow-400 hover:text-yellow-300 p-2 rounded-full hover:bg-gray-600 transition"><Edit size={18} /></button>
                                    <button onClick={(e) => {e.stopPropagation(); handleDeleteChampionship(champ.id)}} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-gray-600 transition"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-4 col-span-full">Nenhum campeonato criado ainda.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// Base component for Create/Edit forms
function ChampionshipForm({ back, onSave, initialData = {}, isEditing = false }) {
    const [name, setName] = useState(initialData.name || '');
    const [sport, setSport] = useState(initialData.sport || 'Futsal');
    const [format, setFormat] = useState(initialData.format || 'league');
    const [matchType, setMatchType] = useState(initialData.matchType || 'one_leg');
    const [allTeams, setAllTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState(initialData.teams ? initialData.teams.map(t => t.id) : []);
    const [numGroups, setNumGroups] = useState(initialData.numGroups || 4);
    
    useEffect(() => {
        const fetchTeams = async () => {
            const teamsSnapshot = await getDocs(collection(db, getDbPath('teams')));
            const sortedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name));
            setAllTeams(sortedTeams);
        };
        fetchTeams();
    }, []);

    const handleTeamToggle = (teamId) => {
        setSelectedTeams(prev => 
            prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || selectedTeams.length < 2) {
            return;
        }

        const championshipData = {
            name: name.trim(),
            sport,
            format,
            matchType,
            teams: allTeams.filter(t => selectedTeams.includes(t.id)).map(t => ({id: t.id, name: t.name})),
            groups: {},
            numGroups: format === 'group_knockout' ? numGroups : null,
        };
        
        if (format === 'group_knockout') {
            if (selectedTeams.length < numGroups) {
                return;
            }
            const shuffledTeams = [...selectedTeams].sort(() => 0.5 - Math.random());
            const groups = {};
            for (let i = 0; i < numGroups; i++) {
                groups[String.fromCharCode(65 + i)] = [];
            }
            shuffledTeams.forEach((teamId, index) => {
                const groupName = String.fromCharCode(65 + (index % numGroups));
                groups[groupName].push(teamId);
            });
            championshipData.groups = groups;
            championshipData.status = initialData.status || 'group_stage';
        } else {
             championshipData.status = initialData.status || 'active';
        }

        onSave(championshipData);
    };
    
    return (
         <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <button onClick={back} className="flex items-center text-teal-400 hover:text-teal-300 mb-4 font-semibold"><ArrowLeft className="mr-2"/>Voltar</button>
            <h2 className="text-2xl font-bold mb-6">{isEditing ? "Editar Campeonato" : "Criar Novo Campeonato"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block mb-2 font-semibold">Nome do Campeonato</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:border-teal-500"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block mb-2 font-semibold">Modalidade</label>
                        <select value={sport} onChange={e => setSport(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                            <option value="Futsal">Futsal</option>
                            <option value="Futebol">Futebol</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Formato</label>
                        <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                            <option value="league">Pontos Corridos</option>
                            <option value="group_knockout">Grupos + Mata-Mata</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Confrontos</label>
                        <select value={matchType} onChange={e => setMatchType(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                            <option value="one_leg">Somente Ida</option>
                            <option value="two_legs">Ida e Volta</option>
                        </select>
                    </div>
                </div>

                {format === 'group_knockout' && (
                     <div>
                        <label className="block mb-2 font-semibold">Número de Grupos</label>
                         <select value={numGroups} onChange={e => setNumGroups(parseInt(e.target.value))} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                            <option value={2}>2</option>
                            <option value={4}>4</option>
                            <option value={8}>8</option>
                        </select>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-bold mb-3">Selecionar Times ({selectedTeams.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-900 rounded-lg">
                        {allTeams.map(team => (
                            <div key={team.id} onClick={() => handleTeamToggle(team.id)} className={`p-3 rounded-lg text-center cursor-pointer transition ${selectedTeams.includes(team.id) ? 'bg-teal-500 text-white font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {team.name}
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition text-lg">
                    <Trophy className="mr-2" /> {isEditing ? "Salvar Alterações" : "Criar Campeonato"}
                </button>
            </form>
        </div>
    );
}

function ChampionshipCreator({ back, onCreated }) {
    const handleSave = async (championshipData) => {
        try {
            const docRef = await addDoc(collection(db, getDbPath('championships')), championshipData);
            onCreated(docRef.id);
        } catch (error) {
            console.error("Error creating championship: ", error);
        }
    };
    return <ChampionshipForm back={back} onSave={handleSave} isEditing={false} />;
}

function ChampionshipEditor({ championshipId, back, onUpdated }) {
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        const fetchChampionship = async () => {
            const champRef = doc(db, getDbPath(`championships/${championshipId}`));
            const champSnap = await getDoc(champRef);
            if (champSnap.exists()) {
                setInitialData(champSnap.data());
            }
        };
        fetchChampionship();
    }, [championshipId]);

    const handleSave = async (championshipData) => {
        try {
            const champRef = doc(db, getDbPath(`championships/${championshipId}`));
            await setDoc(champRef, championshipData);
            onUpdated(championshipId);
        } catch (error) {
            console.error("Error updating championship: ", error);
        }
    };
    
    if (!initialData) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin mr-2" /> Carregando dados do campeonato...</div>;

    return <ChampionshipForm back={back} onSave={handleSave} initialData={initialData} isEditing={true} />;
}


// --- Championship View Component ---
function ChampionshipView({ championshipId, back }) {
    const [championship, setChampionship] = useState(null);
    const [matches, setMatches] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('classification'); // classification, matches

    useEffect(() => {
        if (!championshipId) return;
        setLoading(true);
        const champRef = doc(db, getDbPath(`championships/${championshipId}`));
        const matchesRef = collection(db, getDbPath(`championships/${championshipId}/matches`));
        const venuesRef = collection(db, getDbPath('venues'));

        const unsubChamp = onSnapshot(champRef, (doc) => {
            if (doc.exists()) {
                setChampionship({ id: doc.id, ...doc.data() });
            } else {
                setChampionship(null);
            }
            setLoading(false);
        });

        const unsubMatches = onSnapshot(query(matchesRef), (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMatches(matchesData);
        });

        const unsubVenues = onSnapshot(query(venuesRef), (snapshot) => {
            const venuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVenues(venuesData);
        });

        return () => {
            unsubChamp();
            unsubMatches();
            unsubVenues();
        };
    }, [championshipId]);

    if (loading) return <p>Carregando campeonato...</p>;
    if (!championship) return <div><button onClick={back}>Voltar</button><p>Campeonato não encontrado.</p></div>;

    return (
        <div>
            <button onClick={back} className="flex items-center text-teal-400 hover:text-teal-300 mb-4 font-semibold"><ArrowLeft className="mr-2"/>Voltar para a lista</button>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold text-teal-400">{championship.name}</h2>
                <p className="text-gray-300 capitalize">{championship.sport} | {championship.format === 'league' ? 'Pontos Corridos' : 'Grupos + Mata-Mata'} | {championship.matchType === 'one_leg' ? 'Só Ida' : 'Ida e Volta'}</p>
            </div>

            <div className="flex border-b border-gray-700 mb-6">
                <button onClick={() => setActiveTab('classification')} className={`py-2 px-4 font-semibold ${activeTab === 'classification' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-gray-300'}`}>
                    <BarChart2 className="inline-block mr-2" /> Classificação
                </button>
                <button onClick={() => setActiveTab('matches')} className={`py-2 px-4 font-semibold ${activeTab === 'matches' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-gray-300'}`}>
                    <Calendar className="inline-block mr-2" /> Partidas
                </button>
            </div>

            {activeTab === 'classification' && <Classification championship={championship} matches={matches} />}
            {activeTab === 'matches' && <Matches championship={championship} matches={matches} venues={venues} />}

        </div>
    );
}

// --- Classification Component ---
function Classification({ championship, matches }) {
    const standings = useMemo(() => {
        if (!championship) return {};
        
        const calculateAndSort = (teamsForTable, matchesForTable) => {
            const stats = teamsForTable.reduce((acc, team) => {
                acc[team.id] = { name: team.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, id: team.id };
                return acc;
            }, {});

            const finishedMatches = matchesForTable.filter(m => m.status === 'finished');

            finishedMatches.forEach(match => {
                const { homeTeam, awayTeam, homeScore, awayScore } = match;
                if (stats[homeTeam.id] && stats[awayTeam.id]) {
                    stats[homeTeam.id].P++;
                    stats[awayTeam.id].P++;
                    stats[homeTeam.id].GF += homeScore;
                    stats[homeTeam.id].GA += awayScore;
                    stats[awayTeam.id].GF += awayScore;
                    stats[awayTeam.id].GA += homeScore;

                    if (homeScore > awayScore) {
                        stats[homeTeam.id].W++;
                        stats[homeTeam.id].Pts += 3;
                        stats[awayTeam.id].L++;
                    } else if (awayScore > homeScore) {
                        stats[awayTeam.id].W++;
                        stats[awayTeam.id].Pts += 3;
                        stats[homeTeam.id].L++;
                    } else {
                        stats[homeTeam.id].D++;
                        stats[homeTeam.id].Pts++;
                        stats[awayTeam.id].D++;
                        stats[awayTeam.id].Pts++;
                    }
                }
            });

            const hasPlayed = (team) => team.P > 0;
            const noGamesPlayed = Object.values(stats).every(team => !hasPlayed(team));

            if (noGamesPlayed) {
                return Object.values(stats).sort((a,b) => a.name.localeCompare(b.name));
            }

            return Object.values(stats)
                .map(team => ({ ...team, GD: team.GF - team.GA }))
                .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.name.localeCompare(b.name));
        };
        
        if (championship.format === 'league') {
             return { 'Geral': calculateAndSort(championship.teams, matches) };
        } else if (championship.format === 'group_knockout' && championship.groups) {
            const groupStandings = {};
            for (const groupName in championship.groups) {
                const teamIdsInGroup = championship.groups[groupName];
                const teamsInGroup = championship.teams.filter(t => teamIdsInGroup.includes(t.id));
                const matchesInGroup = matches.filter(m => 
                    teamIdsInGroup.includes(m.homeTeam.id) && teamIdsInGroup.includes(m.awayTeam.id)
                );
                groupStandings[groupName] = calculateAndSort(teamsInGroup, matchesInGroup);
            }
            return groupStandings;
        }
        return {};
    }, [championship, matches]);

    const headers = ['#', 'Time', 'Pts', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'];
    const renderTable = (data, format) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left bg-gray-800 rounded-lg">
                <thead>
                    <tr className="bg-gray-700">
                        {headers.map(h => <th key={h} className="p-3 text-sm font-semibold tracking-wide">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, index) => (
                        <tr key={team.id} className="border-b border-gray-700 last:border-none hover:bg-gray-700/50">
                             <td className={`p-3 font-bold ${(format === 'group_knockout' && index < 2) || (format === 'league' && index < 1) ? 'text-teal-400' : ''}`}>{index + 1}</td>
                            <td className="p-3 font-semibold">{team.name}</td>
                            <td className="p-3 font-bold">{team.Pts}</td>
                            <td className="p-3">{team.P}</td>
                            <td className="p-3">{team.W}</td>
                            <td className="p-3">{team.D}</td>
                            <td className="p-3">{team.L}</td>
                            <td className="p-3">{team.GF}</td>
                            <td className="p-3">{team.GA}</td>
                            <td className="p-3">{team.GD}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    return (
        <div className="space-y-8">
            {Object.keys(standings).length > 0 ? Object.entries(standings).map(([groupName, tableData]) => (
                <div key={groupName} className="bg-gray-800 p-4 rounded-xl">
                    <h3 className="text-xl font-bold mb-4 text-teal-400">
                        {championship.format === 'league' ? 'Tabela de Classificação' : `Grupo ${groupName}`}
                    </h3>
                    {renderTable(tableData, championship.format)}
                </div>
            )) : <p className="text-center text-gray-400 py-4">A classificação aparecerá aqui.</p>}
        </div>
    );
}

// --- Matches Component ---
function Matches({ championship, matches, venues }) {
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [matchTime, setMatchTime] = useState('');
    const [venueId, setVenueId] = useState('');
    
    const [editingMatch, setEditingMatch] = useState(null);
    const [editData, setEditData] = useState({ homeScore: '', awayScore: '', matchTime: '', venueId: '' });

    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenerationOptions, setShowGenerationOptions] = useState(false);
    const [generationOptions, setGenerationOptions] = useState({ venueId: '', matchTime: '' });

    const availableTeams = useMemo(() => championship.teams, [championship.teams]);

    const handleAddManualMatch = async (e) => {
        e.preventDefault();
        if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;

        const homeTeam = availableTeams.find(t => t.id === homeTeamId);
        const awayTeam = availableTeams.find(t => t.id === awayTeamId);
        const venue = venues.find(v => v.id === venueId);

        let round = 'league';
        if (championship.format === 'group_knockout') {
            for (const groupName in championship.groups) {
                if (championship.groups[groupName].includes(homeTeamId)) {
                    round = `group_${groupName}`;
                    break;
                }
            }
        }
        const newMatch = {
            homeTeam: { id: homeTeam.id, name: homeTeam.name },
            awayTeam: { id: awayTeam.id, name: awayTeam.name },
            homeScore: null, awayScore: null, status: 'scheduled', round,
            matchTime: matchTime || null,
            venueId: venueId || null,
            venueName: venue ? venue.name : null,
        };
        
        try {
            await addDoc(collection(db, getDbPath(`championships/${championship.id}/matches`)), newMatch);
            setHomeTeamId(''); setAwayTeamId(''); setMatchTime(''); setVenueId('');
        } catch(error) {
            console.error("Error adding match: ", error);
        }
    };
    
    const handleGenerateAllMatches = async () => {
        setIsGenerating(true);
        try {
            const batch = writeBatch(db);
            const matchesSnapshot = await getDocs(query(collection(db, getDbPath(`championships/${championship.id}/matches`))));
            matchesSnapshot.forEach((doc) => batch.delete(doc.ref));

            const newMatches = [];
            const createFixtures = (teams, round) => {
                if (teams.length < 2) return;
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        newMatches.push({ homeTeam: { id: teams[i].id, name: teams[i].name }, awayTeam: { id: teams[j].id, name: teams[j].name }, status: 'scheduled', homeScore: null, awayScore: null, round });
                        if (championship.matchType === 'two_legs') {
                            newMatches.push({ homeTeam: { id: teams[j].id, name: teams[j].name }, awayTeam: { id: teams[i].id, name: teams[i].name }, status: 'scheduled', homeScore: null, awayScore: null, round });
                        }
                    }
                }
            };

            if (championship.format === 'league') createFixtures(championship.teams, 'league');
            else if (championship.format === 'group_knockout' && championship.groups) {
                for (const groupName in championship.groups) {
                    const teamIds = championship.groups[groupName];
                    const groupTeams = championship.teams.filter(t => teamIds.includes(t.id));
                    createFixtures(groupTeams, `group_${groupName}`);
                }
            }
            
            const venue = venues.find(v => v.id === generationOptions.venueId);
            newMatches.forEach((matchData) => {
                const newMatchRef = doc(collection(db, getDbPath(`championships/${championship.id}/matches`)));
                batch.set(newMatchRef, {
                    ...matchData,
                    matchTime: generationOptions.matchTime || null,
                    venueId: generationOptions.venueId || null,
                    venueName: venue ? venue.name : null
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error generating matches:", error);
        } finally {
            setIsGenerating(false);
            setShowGenerationOptions(false);
        }
    };
    
    const handleUpdateMatch = async (e) => {
        e.preventDefault();
        const home = parseInt(editData.homeScore);
        const away = parseInt(editData.awayScore);
        const venue = venues.find(v => v.id === editData.venueId);
        
        const updates = {
            matchTime: editData.matchTime || null,
            venueId: editData.venueId || null,
            venueName: venue ? venue.name : null,
        };

        if (!isNaN(home) && !isNaN(away)) {
            updates.homeScore = home;
            updates.awayScore = away;
            updates.status = 'finished';
        } else if (editData.homeScore === '' && editData.awayScore === '') {
            updates.homeScore = null;
            updates.awayScore = null;
            updates.status = 'scheduled';
        }

        const matchRef = doc(db, getDbPath(`championships/${championship.id}/matches/${editingMatch.id}`));
        try {
            await setDoc(matchRef, updates, { merge: true });
            setEditingMatch(null);
        } catch(error) {
            console.error("Error updating match: ", error);
        }
    };

    const startEditing = (match) => {
        setEditingMatch(match);
        setEditData({
            homeScore: match.homeScore !== null ? String(match.homeScore) : '',
            awayScore: match.awayScore !== null ? String(match.awayScore) : '',
            matchTime: match.matchTime || '',
            venueId: match.venueId || '',
        });
    };

    const groupedMatches = useMemo(() => {
        return matches.reduce((acc, match) => {
            const groupKey = match.round && match.round.startsWith('group_') ? `Grupo ${match.round.split('_')[1]}` : 'Rodada Única';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(match);
            return acc;
        }, {});
    }, [matches]);
    
    const formatDateTime = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    };

    return (
        <div className="space-y-6">
             <div className="bg-gray-800 p-4 rounded-xl">
                 <h3 className="text-xl font-bold mb-4 text-teal-400">Adicionar Partida Manual</h3>
                <form onSubmit={handleAddManualMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                         <option value="">Selecione Time da Casa</option>
                         {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                     <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                        <option value="">Selecione Time Visitante</option>
                         {availableTeams.filter(t => t.id !== homeTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="datetime-local" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600"/>
                    <select value={venueId} onChange={e => setVenueId(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                        <option value="">Selecione o Local</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <button type="submit" className="md:col-span-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition w-full">
                         <Plus className="mr-2" /> Adicionar Partida
                    </button>
                </form>
            </div>
            
             <div className="bg-gray-800 p-4 rounded-xl">
                 <h3 className="text-xl font-bold mb-4 text-teal-400">Gerenciar Rodadas</h3>
                <button 
                    onClick={() => setShowGenerationOptions(true)} 
                    disabled={isGenerating}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition w-full md:w-auto disabled:bg-orange-800 disabled:cursor-not-allowed"
                >
                    <RefreshCw className="mr-2" /> Gerar Todas as Partidas
                </button>
                {showGenerationOptions && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg space-y-3">
                         <h4 className="font-semibold">Opções de Geração (Opcional)</h4>
                         <select value={generationOptions.venueId} onChange={e => setGenerationOptions({...generationOptions, venueId: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                            <option value="">Local Padrão (Nenhum)</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <input type="datetime-local" value={generationOptions.matchTime} onChange={e => setGenerationOptions({...generationOptions, matchTime: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600"/>
                        <div className="flex gap-2">
                            <button onClick={() => setShowGenerationOptions(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Cancelar</button>
                            <button onClick={handleGenerateAllMatches} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirmar Geração</button>
                        </div>
                    </div>
                )}
                 <p className="text-xs text-gray-400 mt-2">Atenção: Isso substituirá todas as partidas existentes.</p>
            </div>
            
            {editingMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleUpdateMatch} className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md space-y-4">
                         <h3 className="text-xl font-bold">Editar Partida</h3>
                         <p className="text-center font-semibold text-lg">{editingMatch.homeTeam.name} vs {editingMatch.awayTeam.name}</p>
                         <div className="flex items-center justify-center gap-4">
                            <input type="number" min="0" placeholder="-" value={editData.homeScore} onChange={e => setEditData({...editData, homeScore: e.target.value})} className="w-20 bg-gray-700 p-3 rounded-lg text-center text-xl font-bold"/>
                             <span className="text-xl font-bold">X</span>
                            <input type="number" min="0" placeholder="-" value={editData.awayScore} onChange={e => setEditData({...editData, awayScore: e.target.value})} className="w-20 bg-gray-700 p-3 rounded-lg text-center text-xl font-bold"/>
                         </div>
                         <input type="datetime-local" value={editData.matchTime} onChange={e => setEditData({...editData, matchTime: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600"/>
                         <select value={editData.venueId} onChange={e => setEditData({...editData, venueId: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg border-2 border-gray-600">
                             <option value="">Selecione o Local</option>
                             {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                         </select>
                         <div className="mt-6 flex gap-4">
                             <button type="button" onClick={() => setEditingMatch(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Cancelar</button>
                             <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Salvar Alterações</button>
                         </div>
                    </form>
                </div>
            )}
            
            <div className="space-y-6">
            {Object.keys(groupedMatches).length > 0 ? Object.entries(groupedMatches).map(([round, roundMatches]) => (
                <div key={round} className="bg-gray-800 p-4 rounded-xl">
                    <h3 className="text-lg font-bold mb-4 capitalize text-teal-300">{round}</h3>
                    <div className="space-y-3">
                        {roundMatches.map(match => (
                            <div key={match.id} className="bg-gray-700 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2">
                                <span className="w-full sm:w-2/5 text-center sm:text-right font-semibold">{match.homeTeam.name}</span>
                                <div className="flex-shrink-0 text-center cursor-pointer" onClick={() => startEditing(match)}>
                                    {match.status === 'finished' ? (
                                        <div className="px-3 py-1 bg-gray-900 rounded-md text-lg font-bold hover:bg-gray-600">
                                            {match.homeScore} x {match.awayScore}
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-md hover:bg-teal-600 transition">
                                            vs
                                        </div>
                                    )}
                                </div>
                                <span className="w-full sm:w-2/5 text-center sm:text-left font-semibold">{match.awayTeam.name}</span>
                                 <div className="w-full sm:w-auto text-center sm:text-right text-xs text-gray-400 mt-2 sm:mt-0">
                                     {formatDateTime(match.matchTime) && <div>{formatDateTime(match.matchTime)}</div>}
                                     {match.venueName && <div className="font-semibold text-gray-300">{match.venueName}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )) : <p className="text-center text-gray-400 py-4">Nenhuma partida agendada. Gere as partidas ou adicione manualmente.</p>}
            </div>
        </div>
    );
}
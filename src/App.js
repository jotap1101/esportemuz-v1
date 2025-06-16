
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { getFirestore, collection, doc, addDoc, getDocs, setDoc, deleteDoc, onSnapshot, getDoc, writeBatch, query } from 'firebase/firestore';
// import { ArrowLeft, Plus, Trash2, Trophy, Users, BarChart2, Calendar, RefreshCw, Edit, Check, X, MapPin } from 'lucide-react';

// // --- Firebase Configuration ---
// // These global variables are provided by the environment.
// const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-championship-manager';

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// // --- Helper Functions ---
// const getDbPath = (path) => `/artifacts/${appId}/public/data/${path}`;

// // --- Main App Component ---
// export default function App() {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [view, setView] = useState('championships'); // 'teams', 'venues', 'championships', 'view_championship', 'create_championship', 'edit_championship'
//     const [selectedChampionshipId, setSelectedChampionshipId] = useState(null);

//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//             if (currentUser) {
//                 setUser(currentUser);
//             } else {
//                 signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
//             }
//             setLoading(false);
//         });
//         return () => unsubscribe();
//     }, []);
    
//     const navigateTo = (newView, championshipId = null) => {
//         setView(newView);
//         setSelectedChampionshipId(championshipId);
//     };

//     if (loading) {
//         return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><RefreshCw className="animate-spin mr-2" /> Carregando...</div>;
//     }
    
//     if (!user) {
//         return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Autenticando...</div>;
//     }

//     const renderContent = () => {
//         switch (view) {
//             case 'teams':
//                 return <TeamManagement back={() => navigateTo('championships')} />;
//             case 'venues':
//                  return <VenueManagement back={() => navigateTo('championships')} />;
//             case 'championships':
//                 return <ChampionshipList navigateTo={navigateTo} />;
//             case 'create_championship':
//                 return <ChampionshipCreator back={() => navigateTo('championships')} onCreated={(id) => navigateTo('view_championship', id)} />;
//             case 'edit_championship':
//                 return <ChampionshipEditor championshipId={selectedChampionshipId} back={() => navigateTo('championships')} onUpdated={(id) => navigateTo('view_championship', id)} />;
//             case 'view_championship':
//                 return <ChampionshipView championshipId={selectedChampionshipId} back={() => navigateTo('championships')} />;
//             default:
//                 return <ChampionshipList navigateTo={navigateTo} />;
//         }
//     };

//     return (
//         <div className="bg-gray-900 text-white min-h-screen font-sans">
//             <div className="container mx-auto p-4 md:p-6">
//                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                     <h1 className="text-3xl font-bold text-teal-400 mb-2 sm:mb-0 flex items-center">
//                         <Trophy className="mr-3" /> Gerenciador de Campeonatos
//                     </h1>
//                     <nav className="flex items-center space-x-2">
//                         <button onClick={() => navigateTo('championships')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view.includes('championship') ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
//                             <Trophy className="w-4 h-4 mr-2" /> Campeonatos
//                         </button>
//                         <button onClick={() => navigateTo('teams')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view === 'teams' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
//                             <Users className="w-4 h-4 mr-2" /> Times
//                         </button>
//                          <button onClick={() => navigateTo('venues')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${view === 'venues' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
//                             <MapPin className="w-4 h-4 mr-2" /> Locais
//                         </button>
//                     </nav>
//                 </header>
//                 <main>
//                     {renderContent()}
//                 </main>
//             </div>
//         </div>
//     );
// }
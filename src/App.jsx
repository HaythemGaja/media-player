const { useState, useEffect } = React;
const { Home, Film, Tv, Search, User } = window.LucideIcons;
const { AppContext, HomeView, MoviesView, TvView, SearchView, ProfileView, SeeAllView, DetailsModal, PlayerOverlay, DEFAULT_SERVERS } = window.UIP;

const App = () => {
    const [tmdbKey, setTmdbKey] = useState('15d2ea6d0dc1d476efbca3eba2b9bbfb');
    const [selectedServerId, setSelectedServerId] = useState('vidsrc2');
    const [dbLanguage, setDbLanguage] = useState('en-US');
    const [servers, setServers] = useState(DEFAULT_SERVERS);
    
    const [favorites, setFavorites] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [watchedEpisodes, setWatchedEpisodes] = useState({});
    const [customLists, setCustomLists] = useState([]);
    const [hideAdult, setHideAdult] = useState(true);

    const [activeTab, setActiveTab] = useState('home'); 
    const [seeAllConfig, setSeeAllConfig] = useState(null); 
    const [selectedMedia, setSelectedMedia] = useState(null); 
    const [activePlayerMedia, setActivePlayerMedia] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const openDetails = (media) => setSelectedMedia(media);
    const closeDetails = () => setSelectedMedia(null);
    
    // Core Functions required by child components
    const launchPlayer = (item, season = null, episode = null, epTitle = null, fullDetails = null) => {
        const type = item.media_type || item.Type || (item.name ? 'tv' : 'movie');
        setActivePlayerMedia({ tmdbId: item.id, imdbId: item.imdbID || item.external_ids?.imdb_id || fullDetails?.external_ids?.imdb_id, type: type === 'series' ? 'tv' : type, season, episode, title: item.title || item.name || item.Title });
        closeDetails();
    };

    const toggleFavorite = (item) => {
        setFavorites(prev => prev.some(f => f.id === item.id) ? prev.filter(f => f.id !== item.id) : [{id: item.id, Title: item.title || item.name, Type: item.media_type || (item.name ? 'tv' : 'movie'), Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster, backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : item.backdrop}, ...prev]);
    };

    const toggleItemInList = (listId, item) => {
        setCustomLists(prev => prev.map(list => {
            if (list.id !== listId) return list;
            const exists = list.items.some(i => i.id === item.id);
            let newItems = exists ? list.items.filter(i => i.id !== item.id) : [...list.items, { id: item.id, Title: item.title || item.name || item.Title, Type: item.media_type || (item.name ? 'tv' : 'movie'), Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster, backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : item.backdrop }];
            return { ...list, items: newItems };
        }));
    };

    const markEpisodeWatched = (tmdbId, seasonNum, epNum, isWatched = true) => {
        setWatchedEpisodes(prev => {
            const next = { ...prev };
            if (!next[tmdbId]) next[tmdbId] = {};
            next[tmdbId] = { ...next[tmdbId] };
            if (!next[tmdbId][seasonNum]) next[tmdbId][seasonNum] = [];
            next[tmdbId][seasonNum] = [...next[tmdbId][seasonNum]];
            
            if (isWatched && !next[tmdbId][seasonNum].includes(epNum)) next[tmdbId][seasonNum].push(epNum);
            else if (!isWatched) next[tmdbId][seasonNum] = next[tmdbId][seasonNum].filter(e => e !== epNum);
            return next;
        });
    };

    const updateHistoryProgress = (historyId, progressPercent) => {
        setHistoryList(prev => prev.map(h => h.historyId === historyId ? { ...h, progress: Math.min(100, Math.max(0, progressPercent)) } : h));
    };

    const contextValue = {
        tmdbKey, setTmdbKey, dbLanguage, setDbLanguage, hideAdult, setHideAdult, selectedServerId, setSelectedServerId, servers, setServers,
        favorites, setFavorites, historyList, setHistoryList, watchedEpisodes, setWatchedEpisodes, customLists, setCustomLists,
        activeTab, setActiveTab, seeAllConfig, setSeeAllConfig, selectedMedia, setSelectedMedia, activePlayerMedia, setActivePlayerMedia,
        openDetails, closeDetails, launchPlayer, toggleFavorite, toggleItemInList, markEpisodeWatched, updateHistoryProgress, notifications, loadingNotifications, isRTL: false
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="relative w-full h-full min-h-screen pb-20 bg-[#0f0f0f]">
                {seeAllConfig ? <SeeAllView config={seeAllConfig} onBack={() => setSeeAllConfig(null)} /> : (
                    <>
                        {activeTab === 'home' && <HomeView />}
                        {activeTab === 'movies' && <MoviesView />}
                        {activeTab === 'tv' && <TvView />}
                        {activeTab === 'search' && <SearchView />}
                        {activeTab === 'profile' && <ProfileView />}
                    </>
                )}

                <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/10 px-6 py-3 z-40">
                    <div className="max-w-md mx-auto flex justify-between items-center">
                        {[
                            { id: 'home', icon: Home, label: 'Home' },
                            { id: 'movies', icon: Film, label: 'Movies' },
                            { id: 'tv', icon: Tv, label: 'TV Shows' },
                            { id: 'search', icon: Search, label: 'Search' },
                            { id: 'profile', icon: User, label: 'Library' }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => {setActiveTab(tab.id); setSeeAllConfig(null); window.scrollTo(0,0);}} className={`flex flex-col items-center gap-1 focus:outline-none focus:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'} transition-all`}>
                                    <Icon size={22} className={activeTab === tab.id ? 'stroke-current' : ''} />
                                    <span className="text-[9px] font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedMedia && <DetailsModal media={selectedMedia} onClose={closeDetails} />}
                {activePlayerMedia && <PlayerOverlay />}
            </div>
        </AppContext.Provider>
    );
};

window.UIP.App = App;

const { useState, useEffect } = React;
const { Film, Tv, Search, User } = window.LucideIcons;
const { AppContext, MoviesView, TvView, SearchView, ProfileView, SeeAllView, DetailsModal, PlayerOverlay, DEFAULT_SERVERS } = window.UIP;

const App = () => {
    // 1. Core State
    const [tmdbKey, setTmdbKey] = useState(() => localStorage.getItem('vaTmdbKey') || '15d2ea6d0dc1d476efbca3eba2b9bbfb');
    const [selectedServerId, setSelectedServerId] = useState(() => localStorage.getItem('vaServer') || 'vidsrc2');
    const [dbLanguage, setDbLanguage] = useState(() => localStorage.getItem('vaLanguage') || 'en-US');
    const [servers, setServers] = useState(() => { try { const saved = localStorage.getItem('vaServers'); return saved ? JSON.parse(saved) : DEFAULT_SERVERS; } catch(e) { return DEFAULT_SERVERS; } });
    
    // 2. Persistent Storage Data (RESTORED FIX)
    const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('vaFavorites')) || []; } catch(e) { return []; } });
    const [historyList, setHistoryList] = useState(() => { try { return JSON.parse(localStorage.getItem('vaHistory')) || []; } catch(e) { return []; } });
    const [watchedEpisodes, setWatchedEpisodes] = useState(() => { try { return JSON.parse(localStorage.getItem('vaWatched')) || {}; } catch(e) { return {}; } });
    const [customLists, setCustomLists] = useState(() => { try { return JSON.parse(localStorage.getItem('vaCustomLists')) || []; } catch(e) { return []; } });
    const [hideAdult, setHideAdult] = useState(() => { try { const saved = localStorage.getItem('vaHideAdult'); return saved !== null ? JSON.parse(saved) : true; } catch(e) { return true; } });

    // 3. UI State (Default changed to 'movies' since Home is removed)
    const [activeTab, setActiveTab] = useState('movies'); 
    const [seeAllConfig, setSeeAllConfig] = useState(null); 
    const [selectedMedia, setSelectedMedia] = useState(null); 
    const [activePlayerMedia, setActivePlayerMedia] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // 4. Save to Storage whenever data changes
    useEffect(() => localStorage.setItem('vaFavorites', JSON.stringify(favorites)), [favorites]);
    useEffect(() => localStorage.setItem('vaHistory', JSON.stringify(historyList)), [historyList]);
    useEffect(() => localStorage.setItem('vaWatched', JSON.stringify(watchedEpisodes)), [watchedEpisodes]);
    useEffect(() => localStorage.setItem('vaCustomLists', JSON.stringify(customLists)), [customLists]);
    useEffect(() => localStorage.setItem('vaHideAdult', JSON.stringify(hideAdult)), [hideAdult]);
    useEffect(() => localStorage.setItem('vaServer', selectedServerId), [selectedServerId]);
    useEffect(() => localStorage.setItem('vaTmdbKey', tmdbKey), [tmdbKey]);
    useEffect(() => localStorage.setItem('vaLanguage', dbLanguage), [dbLanguage]);
    useEffect(() => localStorage.setItem('vaServers', JSON.stringify(servers)), [servers]);

    // 5. Notification Logic for New Episodes (RESTORED FIX)
    useEffect(() => {
        const fetchNewEpisodes = async () => {
            setLoadingNotifications(true);
            try {
                const tvShows = new Map();
                favorites.forEach(item => { if (item.Type === 'tv' || item.Type === 'series') tvShows.set(item.id, item); });
                customLists.forEach(list => list.items.forEach(item => { if (item.Type === 'tv' || item.Type === 'series') tvShows.set(item.id, item); }));

                if (tvShows.size === 0) {
                    setNotifications([]);
                    setLoadingNotifications(false);
                    return;
                }
                const promises = Array.from(tvShows.keys()).map(id =>
                    fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${tmdbKey}&language=${dbLanguage}`).then(res => res.ok ? res.json() : null)
                );
                const details = await Promise.all(promises);
                const newEpsList = [];
                const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                const today = new Date();

                details.forEach(show => {
                    if (!show || !show.last_episode_to_air) return;
                    const lastEp = show.last_episode_to_air;
                    if (!lastEp.air_date) return;
                    const airDate = new Date(lastEp.air_date);
                    if (airDate >= sixtyDaysAgo && airDate <= today) {
                        const isWatched = watchedEpisodes[show.id]?.[lastEp.season_number]?.includes(lastEp.episode_number);
                        if (!isWatched) {
                            newEpsList.push({
                                ...tvShows.get(show.id), Title: show.name,
                                backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/w780${show.backdrop_path}` : null,
                                Poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
                                newEpInfo: lastEp
                            });
                        }
                    }
                });
                newEpsList.sort((a, b) => new Date(b.newEpInfo.air_date) - new Date(a.newEpInfo.air_date));
                setNotifications(newEpsList);
            } catch (e) { }
            setLoadingNotifications(false);
        };
        fetchNewEpisodes();
    }, [favorites, customLists, watchedEpisodes, tmdbKey, dbLanguage]);

    const openDetails = (media) => setSelectedMedia(media);
    const closeDetails = () => setSelectedMedia(null);
    
    const launchPlayer = (item, season = null, episode = null, epTitle = null, fullDetails = null) => {
        const type = item.media_type || item.Type || (item.name ? 'tv' : 'movie');
        
        setActivePlayerMedia({ tmdbId: item.id, imdbId: item.imdbID || item.external_ids?.imdb_id || fullDetails?.external_ids?.imdb_id, type: type === 'series' ? 'tv' : type, season, episode, title: item.title || item.name || item.Title });
        if (type === 'tv' || type === 'series') markEpisodeWatched(item.id, season, episode, true);

        const histId = `${item.id}-${season || '0'}-${episode || '0'}`;
        const newRecord = {
            historyId: histId, id: item.id, imdbID: item.imdbID || item.external_ids?.imdb_id, Title: item.title || item.name || item.Title, Type: type,
            Poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : item.backdrop,
            season, episode, epTitle, timestamp: Date.now(), 
            runtime: fullDetails?.runtime || (fullDetails?.episode_run_time?.[0]) || (type === 'movie' ? 120 : 45), 
            genres: fullDetails?.genres?.map(g => g.id) || item.genre_ids || [], progress: 10 
        };

        setHistoryList(prev => [newRecord, ...prev.filter(h => h.historyId !== histId)].slice(0, 500));
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
                        {activeTab === 'movies' && <MoviesView />}
                        {activeTab === 'tv' && <TvView />}
                        {activeTab === 'search' && <SearchView />}
                        {activeTab === 'profile' && <ProfileView />}
                    </>
                )}

                <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/10 px-6 py-3 z-40">
                    <div className="max-w-md mx-auto flex justify-between items-center">
                        {[
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

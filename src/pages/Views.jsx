const { useState, useEffect, useContext, useMemo } = React;
const { Search, X, PlayCircle, Heart, Plus, Trash2, Share2, Clock, PieChart, BarChart2, History, Play, Bell, Server, User, Filter, Settings } = window.LucideIcons;
const { AppContext, HeroBanner, NewEpisodesRow, ContinueWatchingRow, MediaRow, FilteredGridView, ROW_CONFIGS, GENRE_MAP, DEFAULT_SERVERS } = window.UIP;

const HomeView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <HeroBanner endpoint="/trending/all/day" />
            <div className="mt-[-80px] relative z-10">
                <NewEpisodesRow />
                <ContinueWatchingRow filterType="all" />
                {ROW_CONFIGS.home.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const MoviesView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500 relative">
            <HeroBanner endpoint="/trending/movie/day" />
            <div className="mt-[-80px] relative z-10">
                <ContinueWatchingRow filterType="movie" />
                {ROW_CONFIGS.movies.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const TvView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500 relative">
            <HeroBanner endpoint="/trending/tv/day" />
            <div className="mt-[-80px] relative z-10">
                <ContinueWatchingRow filterType="tv" />
                {ROW_CONFIGS.tv.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const SearchView = () => {
    const { tmdbKey, dbLanguage, hideAdult, openDetails } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    
    useEffect(() => {
        if (!searchQuery.trim()) { setResults([]); return; }
        const handler = setTimeout(() => {
            fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=${dbLanguage}&query=${encodeURIComponent(searchQuery)}&include_adult=${!hideAdult}`)
                .then(res => res.json()).then(data => setResults((data.results || []).filter(i => i.media_type !== 'person' && i.backdrop_path && (hideAdult ? !i.adult : true))));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    return (
        <div className="pt-12 pb-24 px-4 max-w-2xl mx-auto min-h-screen animate-in fade-in">
            <div className="bg-[#2b2b2b] flex items-center px-4 py-3 rounded-md mb-6 sticky top-4 z-20 shadow-xl">
                <Search size={20} className="text-gray-400 mr-3" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent text-white w-full outline-none" />
            </div>
            <div className="space-y-4">
                {results.map(item => (
                    <div key={item.id} onClick={() => openDetails(item)} className="flex items-center gap-4 cursor-pointer group hover:bg-[#1e1e1e] p-2 rounded-lg transition-colors">
                        <img src={`https://image.tmdb.org/t/p/w300${item.backdrop_path || item.poster_path}`} className="w-32 aspect-video object-cover rounded bg-neutral-800" />
                        <span className="font-bold text-sm sm:text-base flex-grow line-clamp-2">{item.title || item.name}</span>
                        <PlayCircle size={28} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileView = () => {
    const { 
        historyList, setHistoryList, customLists, setCustomLists, favorites, openDetails, 
        hideAdult, setHideAdult, selectedServerId, setSelectedServerId,
        servers, setServers, 
        tmdbKey, setTmdbKey, setWatchedEpisodes, launchPlayer, notifications, loadingNotifications 
    } = useContext(AppContext);

    const [activeProfileTab, setActiveProfileTab] = useState('watchlist');
    const [newListMode, setNewListMode] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [showNotif, setShowNotif] = useState(false);
    
    const [customServerName, setCustomServerName] = useState('');
    const [customServerUrl, setCustomServerUrl] = useState('');

    const stats = useMemo(() => {
        let totalMinutes = 0;
        let typeCount = { tv: 0, movie: 0 };
        let genres = {};
        historyList.forEach(item => {
            totalMinutes += item.runtime || (item.Type === 'movie' ? 120 : 45);
            typeCount[item.Type] = (typeCount[item.Type] || 0) + 1;
            if (item.genres) item.genres.forEach(g => { genres[g] = (genres[g] || 0) + 1; });
        });
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = (totalHours / 24).toFixed(1);
        const topGenres = Object.entries(genres).sort((a,b) => b[1] - a[1]).slice(0, 3).map(g => GENRE_MAP[g[0]] || "Unknown");
        return { totalHours, totalDays, typeCount, topGenres };
    }, [historyList]);

    const handleShareList = (list) => {
        const text = `Check out my list "${list.name}" on Universal Index Player:\n\n` + list.items.map((i, idx) => `${idx + 1}. ${i.Title} (${i.Type})`).join('\n');
        try {
            const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
            alert("List copied to clipboard! Share it with friends.");
        } catch(e) {}
    };

    const createCustomList = (name) => {
        if (!name.trim()) return;
        setCustomLists(prev => [...prev, { id: Date.now().toString(), name, items: [] }]);
    };

    const handleAddServer = () => {
        if (!customServerName.trim() || !customServerUrl.trim()) return;
        
        let finalTemplate = customServerUrl.trim();
        if (!finalTemplate.includes('{tmdb}') && !finalTemplate.includes('{imdb}')) {
            const domain = finalTemplate.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
            finalTemplate = `https://${domain}/embed/{type}/{tmdb}/{s}/{e}`;
        }

        setServers(prev => [...prev, { id: 'server_' + Date.now(), name: customServerName, urlTemplate: finalTemplate }]);
        setCustomServerName('');
        setCustomServerUrl('');
    };

    const handleRemoveServer = (id) => {
        setServers(prev => {
            const remaining = prev.filter(s => s.id !== id);
            if (selectedServerId === id) {
                setSelectedServerId(remaining.length > 0 ? remaining[0].id : '');
            }
            return remaining;
        });
    };

    const handleResetServers = () => {
        setServers(DEFAULT_SERVERS);
        setSelectedServerId(DEFAULT_SERVERS[0].id);
    };

    return (
        <div className="pt-10 pb-24 max-w-4xl mx-auto min-h-screen animate-in fade-in">
            <div className="px-6 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"><User size={32} className="text-white"/></div>
                    <div><h1 className="text-2xl font-bold">My Library</h1><p className="text-sm text-gray-400">{historyList.length} items watched</p></div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button onClick={() => setShowNotif(!showNotif)} className="p-2 bg-[#1e1e1e] rounded-full hover:bg-neutral-800 text-amber-400 relative" title="Release Alerts">
                            <Bell size={20} />
                            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0f0f0f]"></span>}
                        </button>
                        {showNotif && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-72 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-gray-700 font-bold text-white flex justify-between items-center">
                                        Notifications
                                        <span className="text-[10px] bg-red-500 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto hide-scrollbar">
                                        {loadingNotifications ? (
                                            <div className="p-4 text-center text-gray-400 text-xs">Loading...</div>
                                        ) : notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-xs">No new episodes</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} onClick={() => { openDetails(n); setShowNotif(false); }} className="p-3 border-b border-gray-800/50 hover:bg-neutral-800 cursor-pointer flex gap-3 text-left transition-colors">
                                                    <img src={n.Poster} className="w-10 h-14 object-cover rounded shadow" />
                                                    <div className="flex flex-col justify-center min-w-0">
                                                        <div className="text-sm font-bold text-white line-clamp-1">{n.Title}</div>
                                                        <div className="text-xs text-red-400 font-medium">S{n.newEpInfo.season_number} E{n.newEpInfo.episode_number}</div>
                                                        <div className="text-[10px] text-gray-500">{new Date(n.newEpInfo.air_date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setActiveProfileTab('settings')} className={`p-2 rounded-full transition-colors ${activeProfileTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-[#1e1e1e] hover:bg-neutral-800 text-gray-400'}`}><Settings size={20}/></button>
                </div>
            </div>

            <div className="px-6 flex gap-4 mb-8 border-b border-gray-800 pb-2 overflow-x-auto hide-scrollbar">
                <button onClick={() => setActiveProfileTab('watchlist')} className={`pb-2 font-bold whitespace-nowrap outline-none ${activeProfileTab === 'watchlist' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500'}`}>Watchlist</button>
                <button onClick={() => setActiveProfileTab('lists')} className={`pb-2 font-bold whitespace-nowrap outline-none ${activeProfileTab === 'lists' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500'}`}>Custom Lists</button>
                <button onClick={() => setActiveProfileTab('stats')} className={`pb-2 font-bold whitespace-nowrap outline-none ${activeProfileTab === 'stats' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500'}`}>Viewing Stats</button>
                <button onClick={() => setActiveProfileTab('history')} className={`pb-2 font-bold whitespace-nowrap outline-none ${activeProfileTab === 'history' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500'}`}>History</button>
            </div>

            <div className="px-6">
                {activeProfileTab === 'watchlist' && (
                    <div className="animate-in fade-in">
                        {favorites.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-[#181818] rounded-xl border border-gray-800"><Heart size={32} className="mx-auto mb-3 opacity-20" /><p>Your watchlist is empty.</p></div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {favorites.map(item => (
                                    <div key={item.id} onClick={() => openDetails(item)} className="cursor-pointer transition-transform hover:scale-105">
                                        <img src={item.Poster} className="w-full aspect-[2/3] object-cover rounded-md shadow-lg" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeProfileTab === 'lists' && (
                    <div className="animate-in fade-in space-y-6">
                        {newListMode ? (
                            <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex gap-3">
                                <input type="text" autoFocus value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="List Name (e.g. Anime)" className="bg-neutral-800 px-4 py-2 rounded outline-none flex-grow" />
                                <button onClick={() => { createCustomList(newListName); setNewListMode(false); setNewListName(''); }} className="bg-indigo-600 px-4 py-2 rounded font-bold">Create</button>
                                <button onClick={() => setNewListMode(false)} className="bg-neutral-700 px-4 py-2 rounded">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setNewListMode(true)} className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-indigo-500 flex justify-center items-center gap-2 transition-colors font-bold"><Plus size={20}/> Create New List</button>
                        )}

                        {customLists.map(list => (
                            <div key={list.id} className="bg-[#181818] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                                <div className="p-4 bg-neutral-900 border-b border-gray-800 flex justify-between items-center">
                                    <h3 className="font-bold text-lg">{list.name} <span className="text-gray-500 text-sm font-normal">({list.items.length})</span></h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleShareList(list)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-indigo-400" title="Copy to share"><Share2 size={16}/></button>
                                        <button onClick={() => setCustomLists(prev => prev.filter(l => l.id !== list.id))} className="p-2 bg-neutral-800 hover:bg-red-900/40 rounded text-red-400" title="Delete List"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="p-4 flex overflow-x-auto gap-3 hide-scrollbar">
                                    {list.items.length === 0 ? <p className="text-sm text-gray-500 py-4">No items yet. Add them from a movie's details page.</p> : 
                                        list.items.map(item => (
                                            <img key={item.id} onClick={() => openDetails(item)} src={item.Poster} className="w-24 aspect-[2/3] object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" />
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeProfileTab === 'stats' && (
                    <div className="animate-in fade-in space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-indigo-900/40 to-[#181818] p-5 rounded-xl border border-indigo-500/20">
                                <Clock size={24} className="text-indigo-400 mb-2"/>
                                <p className="text-sm text-gray-400 font-medium">Total Watch Time</p>
                                <h2 className="text-3xl font-extrabold mt-1">{stats.totalHours} <span className="text-lg font-medium text-gray-500">hrs</span></h2>
                                <p className="text-xs text-indigo-300 mt-1">Approx. {stats.totalDays} days</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/40 to-[#181818] p-5 rounded-xl border border-purple-500/20">
                                <PieChart size={24} className="text-purple-400 mb-2"/>
                                <p className="text-sm text-gray-400 font-medium">Media Preference</p>
                                <div className="flex justify-between items-end mt-2">
                                    <div><span className="text-xl font-bold text-white">{stats.typeCount.movie}</span> <span className="text-xs text-gray-500">Movies</span></div>
                                    <div><span className="text-xl font-bold text-white">{stats.typeCount.tv}</span> <span className="text-xs text-gray-500">Shows</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#181818] p-5 rounded-xl border border-gray-800">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2"><BarChart2 size={18}/> Top Genres</h3>
                            {stats.topGenres.length === 0 ? <p className="text-sm text-gray-500">Watch more content to see stats.</p> : (
                                <div className="space-y-3">
                                    {stats.topGenres.map((g, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center font-bold text-gray-400">#{i+1}</div>
                                            <div className="flex-grow bg-neutral-800 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full" style={{width: `${100 - (i*20)}%`}}></div></div>
                                            <div className="w-24 text-right text-sm font-bold">{g}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeProfileTab === 'history' && (
                    <div className="animate-in fade-in">
                        {historyList.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-[#181818] rounded-xl border border-gray-800"><History size={32} className="mx-auto mb-3 opacity-20" /><p>History is empty.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {historyList.map(h => (
                                    <div key={h.historyId} className="flex items-center p-3 bg-[#181818] border border-gray-800 rounded-xl">
                                        <img src={h.Poster} className="w-12 h-16 object-cover rounded shadow mr-4" />
                                        <div className="flex flex-col flex-grow">
                                            <span className="font-bold text-sm">{h.Title}</span>
                                            <span className="text-xs text-gray-400">{h.Type === 'tv' ? `S${h.season} E${h.episode}` : 'Movie'}</span>
                                            <span className="text-[10px] text-gray-500 mt-1">{new Date(h.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => launchPlayer(h, h.season, h.episode, h.epTitle)} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"><Play size={16}/></button>
                                            <button onClick={() => setHistoryList(prev => prev.filter(item => item.historyId !== h.historyId))} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-red-400"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeProfileTab === 'settings' && (
                    <div className="animate-in fade-in space-y-6">
                        <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <span className="font-bold text-sm block">Safe Search (+18)</span>
                                <span className="text-xs text-gray-400">Hide adult content and explicit TMDB results.</span>
                            </div>
                            <button onClick={() => setHideAdult(!hideAdult)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#181818] ${hideAdult ? 'bg-indigo-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideAdult ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="bg-[#181818] p-4 rounded-xl border border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Server size={18} className="text-indigo-400"/> Servers</h2>
                                <button onClick={handleResetServers} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Reset to Default</button>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                                <input type="text" placeholder="Server Name (e.g. StreamIMDb)" value={customServerName} onChange={e => setCustomServerName(e.target.value)} className="w-full bg-[#2b2b2b] px-3 py-2 rounded outline-none text-sm" />
                                <input type="text" placeholder="Server Link (e.g. streamimdb.ru)" value={customServerUrl} onChange={e => setCustomServerUrl(e.target.value)} className="w-full bg-[#2b2b2b] px-3 py-2 rounded outline-none text-sm font-mono" />
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    Just enter the domain link (e.g. <span className="font-mono text-indigo-400">streamimdb.ru</span>) and the app will do the rest!<br/>
                                    Or, use advanced placeholders: <code className="text-indigo-400">{'{tmdb}'}</code>, <code className="text-indigo-400">{'{type}'}</code>, <code className="text-indigo-400">{'{s}'}</code>, <code className="text-indigo-400">{'{e}'}</code>.
                                </p>
                                <button onClick={handleAddServer} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded font-bold text-sm transition-colors mt-2">Add Server</button>
                            </div>
                            
                            {servers.length > 0 && (
                                <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Saved Servers</h3>
                                    {servers.map(server => (
                                        <div key={server.id} className="flex justify-between items-center bg-[#2b2b2b] p-2 rounded">
                                            <div className="flex flex-col overflow-hidden mr-2">
                                                <span className="text-sm font-bold text-white truncate">{server.name}</span>
                                                <span className="text-[10px] text-gray-400 truncate font-mono">{server.urlTemplate}</span>
                                            </div>
                                            <button onClick={() => handleRemoveServer(server.id)} className="p-1.5 bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white rounded transition-colors flex-shrink-0">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-[#181818] p-4 rounded-xl border border-gray-800">
                            <label className="text-sm font-bold text-gray-400 mb-2 block">TMDB API Key</label>
                            <input type="text" value={tmdbKey} onChange={e => setTmdbKey(e.target.value)} className="w-full bg-[#2b2b2b] px-3 py-2 rounded outline-none" />
                        </div>
                        <button onClick={() => { setHistoryList([]); setWatchedEpisodes({}); }} className="w-full bg-red-600/20 text-red-500 py-3 rounded-xl font-bold border border-red-500/20">Wipe All History & Stats Data</button>
                    </div>
                )}
            </div>
        </div>
    );
};

window.UIP.HomeView = HomeView;
window.UIP.MoviesView = MoviesView;
window.UIP.TvView = TvView;
window.UIP.SearchView = SearchView;
window.UIP.ProfileView = ProfileView;

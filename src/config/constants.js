window.UIP = window.UIP || {};

window.UIP.DEFAULT_SERVERS = [
    { id: 'garageband_proxy', name: 'Garageband Proxy', urlTemplate: 'https://proxy.garageband.rocks/embed/{type}/{imdb}/{s}/{e}' },
    { id: 'vsembed_ru', name: 'VsEmbed (.ru)', urlTemplate: 'https://vsembed.ru/embed/{type}/{imdb}/{s}/{e}' },
    { id: 'vsembed_su', name: 'VsEmbed (.su)', urlTemplate: 'https://vsembed.su/embed/{type}/{imdb}/{s}/{e}' },
    { id: 'vidsrc2', name: 'VidSrc2', urlTemplate: 'https://vidsrc2.ru/embed/{type}/{imdb}?s={s}&e={e}' },
    { id: 'autoembed', name: 'AutoEmbed', urlTemplate: 'https://autoembed.to/{type}/tmdb/{tmdb}-{s}-{e}' },
    { id: 'smashy', name: 'SmashyStream', urlTemplate: 'https://player.smashy.stream/{type}/{tmdb}?s={s}&e={e}' }
];

window.UIP.ROW_CONFIGS = {
    home: [
        { title: 'Trending Today', url: '/trending/all/day' },
        { title: 'Movies Trending Today', url: '/trending/movie/day' },
        { title: 'TV Shows Trending Today', url: '/trending/tv/day' },
        { title: 'Box Office', url: '/movie/now_playing' }
    ],
    movies: [
        { title: 'Trending Movies', url: '/trending/movie/week' },
        { title: 'Latest Releases', url: '/movie/now_playing' },
        { title: 'Popular Movies', url: '/movie/popular' },
        { title: 'All Time Favorite Movies', url: '/movie/top_rated' }
    ],
    tv: [
        { title: 'Trending TV Shows', url: '/trending/tv/week' },
        { title: 'Latest Releases', url: '/tv/on_the_air' },
        { title: 'Popular TV Shows', url: '/tv/popular' },
        { title: 'All Time Favorites', url: '/tv/top_rated' }
    ]
};

window.UIP.GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western"
};
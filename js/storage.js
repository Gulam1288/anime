/**
 * Local Storage Management for AnimeVault
 * Handles favorites, user preferences, and search history
 */

class Storage {
    constructor() {
        this.keys = {
            FAVORITES: 'animeVault_favorites',
            SEARCH_HISTORY: 'animeVault_searchHistory',
            PREFERENCES: 'animeVault_preferences',
            VIEW_HISTORY: 'animeVault_viewHistory'
        };
        
        // Initialize storage if not exists
        this.init();
    }

    /**
     * Initialize storage with default values
     */
    init() {
        if (!localStorage.getItem(this.keys.FAVORITES)) {
            localStorage.setItem(this.keys.FAVORITES, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.keys.SEARCH_HISTORY)) {
            localStorage.setItem(this.keys.SEARCH_HISTORY, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.keys.PREFERENCES)) {
            localStorage.setItem(this.keys.PREFERENCES, JSON.stringify({
                theme: 'dark',
                autoplay: true,
                notifications: true,
                language: 'en'
            }));
        }
        
        if (!localStorage.getItem(this.keys.VIEW_HISTORY)) {
            localStorage.setItem(this.keys.VIEW_HISTORY, JSON.stringify([]));
        }
    }

    /**
     * Generic method to get data from localStorage
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving data from localStorage:', error);
            return null;
        }
    }

    /**
     * Generic method to set data to localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    // Favorites Management
    getFavorites() {
        return this.get(this.keys.FAVORITES) || [];
    }

    addFavorite(anime) {
        const favorites = this.getFavorites();
        
        // Check if anime is already in favorites
        const exists = favorites.find(fav => fav.mal_id === anime.mal_id);
        if (exists) {
            return false; // Already exists
        }
        
        // Add essential anime data
        const favoriteData = {
            mal_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english,
            images: anime.images,
            score: anime.score,
            year: anime.year,
            type: anime.type,
            status: anime.status,
            episodes: anime.episodes,
            synopsis: anime.synopsis,
            genres: anime.genres,
            added_date: new Date().toISOString()
        };
        
        favorites.unshift(favoriteData); // Add to beginning
        
        // Limit favorites to 100 items
        if (favorites.length > 100) {
            favorites.pop();
        }
        
        return this.set(this.keys.FAVORITES, favorites);
    }

    removeFavorite(animeId) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(fav => fav.mal_id !== animeId);
        return this.set(this.keys.FAVORITES, filtered);
    }

    isFavorite(animeId) {
        const favorites = this.getFavorites();
        return favorites.some(fav => fav.mal_id === animeId);
    }

    getFavoriteCount() {
        return this.getFavorites().length;
    }

    // Search History Management
    getSearchHistory() {
        return this.get(this.keys.SEARCH_HISTORY) || [];
    }

    addSearchTerm(term) {
        if (!term || term.trim().length < 2) return;
        
        const history = this.getSearchHistory();
        const cleanTerm = term.trim().toLowerCase();
        
        // Remove existing occurrence
        const filtered = history.filter(item => item.term !== cleanTerm);
        
        // Add to beginning
        filtered.unshift({
            term: cleanTerm,
            originalTerm: term.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Limit to 20 recent searches
        const limited = filtered.slice(0, 20);
        
        return this.set(this.keys.SEARCH_HISTORY, limited);
    }

    clearSearchHistory() {
        return this.set(this.keys.SEARCH_HISTORY, []);
    }

    // View History Management
    getViewHistory() {
        return this.get(this.keys.VIEW_HISTORY) || [];
    }

    addToViewHistory(anime) {
        const history = this.getViewHistory();
        
        // Remove existing occurrence
        const filtered = history.filter(item => item.mal_id !== anime.mal_id);
        
        // Add essential data to beginning
        const viewData = {
            mal_id: anime.mal_id,
            title: anime.title,
            title_english: anime.title_english,
            images: anime.images,
            score: anime.score,
            type: anime.type,
            viewed_date: new Date().toISOString()
        };
        
        filtered.unshift(viewData);
        
        // Limit to 50 items
        const limited = filtered.slice(0, 50);
        
        return this.set(this.keys.VIEW_HISTORY, limited);
    }

    clearViewHistory() {
        return this.set(this.keys.VIEW_HISTORY, []);
    }

    // Preferences Management
    getPreferences() {
        return this.get(this.keys.PREFERENCES) || {
            theme: 'dark',
            autoplay: true,
            notifications: true,
            language: 'en'
        };
    }

    updatePreference(key, value) {
        const preferences = this.getPreferences();
        preferences[key] = value;
        return this.set(this.keys.PREFERENCES, preferences);
    }

    updatePreferences(newPreferences) {
        const currentPreferences = this.getPreferences();
        const mergedPreferences = { ...currentPreferences, ...newPreferences };
        return this.set(this.keys.PREFERENCES, mergedPreferences);
    }

    // Utility Methods
    clear() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }

    getStorageSize() {
        let total = 0;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('animeVault_')) {
                total += localStorage.getItem(key).length;
            }
        });
        return total;
    }

    export() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.get(key);
        });
        return data;
    }

    import(data) {
        try {
            Object.entries(data).forEach(([name, value]) => {
                if (this.keys[name]) {
                    this.set(this.keys[name], value);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
const storage = new Storage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}

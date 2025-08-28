/**
 * Jikan API Service for AnimeVault
 * Handles all API requests to Jikan API v4
 */

class JikanAPI {
    constructor() {
        this.baseURL = 'https://api.jikan.moe/v4';
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Rate limiting helper
     */
    async rateLimitedRequest(url) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => 
                setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime = Date.now();
        return fetch(url);
    }

    /**
     * Cache management
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Generic API request with error handling and caching
     */
    async request(endpoint, useCache = true) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = endpoint;
        
        try {
            // Check cache first
            if (useCache) {
                const cachedData = this.getCachedData(cacheKey);
                if (cachedData) {
                    return { success: true, data: cachedData };
                }
            }

            const response = await this.rateLimitedRequest(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache successful responses
            if (useCache && data) {
                this.setCachedData(cacheKey, data);
            }
            
            return { success: true, data };
            
        } catch (error) {
            console.error(`API Request Error for ${url}:`, error);
            return { 
                success: false, 
                error: error.message,
                endpoint 
            };
        }
    }

    /**
     * Search anime by query
     */
    async searchAnime(query, page = 1, limit = 25) {
        if (!query || query.trim().length === 0) {
            return { success: false, error: 'Search query is required' };
        }
        
        const endpoint = `/anime?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}&order_by=score&sort=desc`;
        return await this.request(endpoint, false); // Don't cache searches
    }

    /**
     * Get anime by ID
     */
    async getAnimeById(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}`;
        return await this.request(endpoint);
    }

    /**
     * Get anime full details including relations, recommendations, etc.
     */
    async getAnimeFullById(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/full`;
        return await this.request(endpoint);
    }

    /**
     * Get anime characters
     */
    async getAnimeCharacters(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/characters`;
        return await this.request(endpoint);
    }

    /**
     * Get anime recommendations
     */
    async getAnimeRecommendations(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/recommendations`;
        return await this.request(endpoint);
    }

    /**
     * Get anime relations
     */
    async getAnimeRelations(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/relations`;
        return await this.request(endpoint);
    }

    /**
     * Get top anime
     */
    async getTopAnime(type = '', filter = '', page = 1, limit = 25) {
        const endpoint = `/top/anime?type=${type}&filter=${filter}&page=${page}&limit=${limit}`;
        return await this.request(endpoint);
    }

    /**
     * Get seasonal anime
     */
    async getSeasonalAnime(year, season, page = 1, limit = 25) {
        const endpoint = `/seasons/${year}/${season}?page=${page}&limit=${limit}`;
        return await this.request(endpoint);
    }

    /**
     * Get current season anime
     */
    async getCurrentSeasonAnime(page = 1, limit = 25) {
        const endpoint = `/seasons/now?page=${page}&limit=${limit}`;
        return await this.request(endpoint);
    }

    /**
     * Get anime by genre
     */
    async getAnimeByGenre(genreId, page = 1, limit = 25) {
        const endpoint = `/anime?genres=${genreId}&page=${page}&limit=${limit}&order_by=score&sort=desc`;
        return await this.request(endpoint);
    }

    /**
     * Get all available genres
     */
    async getGenres() {
        const endpoint = '/genres/anime';
        return await this.request(endpoint);
    }

    /**
     * Get random anime
     */
    async getRandomAnime() {
        const endpoint = '/random/anime';
        return await this.request(endpoint, false); // Don't cache random requests
    }

    /**
     * Get trending anime (using top airing)
     */
    async getTrendingAnime(page = 1, limit = 25) {
        const endpoint = `/top/anime?filter=airing&page=${page}&limit=${limit}`;
        return await this.request(endpoint);
    }

    /**
     * Get popular anime (using top by popularity)
     */
    async getPopularAnime(page = 1, limit = 25) {
        const endpoint = `/top/anime?filter=bypopularity&page=${page}&limit=${limit}`;
        return await this.request(endpoint);
    }

    /**
     * Get anime by multiple filters
     */
    async getAnimeFiltered(filters = {}) {
        const params = new URLSearchParams();
        
        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const endpoint = `/anime?${params.toString()}`;
        return await this.request(endpoint, false);
    }

    /**
     * Get anime statistics
     */
    async getAnimeStats(id) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/statistics`;
        return await this.request(endpoint);
    }

    /**
     * Get anime episodes
     */
    async getAnimeEpisodes(id, page = 1) {
        if (!id) {
            return { success: false, error: 'Anime ID is required' };
        }
        
        const endpoint = `/anime/${id}/episodes?page=${page}`;
        return await this.request(endpoint);
    }

    /**
     * Search suggestions (autocomplete)
     */
    async getSearchSuggestions(query, limit = 10) {
        if (!query || query.trim().length < 2) {
            return { success: true, data: { data: [] } };
        }
        
        const endpoint = `/anime?q=${encodeURIComponent(query.trim())}&limit=${limit}&order_by=popularity&sort=asc`;
        const result = await this.request(endpoint, false);
        
        if (result.success) {
            // Transform data for suggestions
            const suggestions = result.data.data.map(anime => ({
                mal_id: anime.mal_id,
                title: anime.title,
                title_english: anime.title_english,
                image: anime.images?.jpg?.small_image_url || anime.images?.jpg?.image_url,
                type: anime.type,
                score: anime.score,
                year: anime.aired?.prop?.from?.year
            }));
            
            return { success: true, data: { data: suggestions } };
        }
        
        return result;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Create global instance
const jikanAPI = new JikanAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JikanAPI;
}

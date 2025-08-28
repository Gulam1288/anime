/**
 * Reusable UI Components for AnimeVault
 */

class UIComponents {
    constructor() {
        this.loadingStates = new Set();
        this.intersectionObserver = null;
        this.initIntersectionObserver();
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    initIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            this.intersectionObserver.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.1, rootMargin: '50px' }
            );
        }
    }

    /**
     * Observe elements for fade-in animation
     */
    observeElements(selector = '.fade-in-up') {
        if (this.intersectionObserver) {
            document.querySelectorAll(selector).forEach(el => {
                this.intersectionObserver.observe(el);
            });
        }
    }

    /**
     * Create anime card component
     */
    createAnimeCard(anime, options = {}) {
        const {
            showFavorite = true,
            showOverlay = true,
            onClick = null,
            className = ''
        } = options;

        const isFavorite = storage.isFavorite(anime.mal_id);
        const score = anime.score || 'N/A';
        const year = anime.aired?.prop?.from?.year || anime.year || 'Unknown';
        const type = anime.type || 'Unknown';
        const episodes = anime.episodes || '?';
        const status = anime.status || 'Unknown';
        
        // Clean synopsis
        let synopsis = anime.synopsis || 'No description available.';
        if (synopsis.length > 150) {
            synopsis = synopsis.substring(0, 150) + '...';
        }
        
        // Get genres
        const genres = anime.genres ? anime.genres.slice(0, 3) : [];

        const card = document.createElement('div');
        card.className = `anime-card fade-in-up ${className}`;
        card.setAttribute('data-anime-id', anime.mal_id);

        card.innerHTML = `
            <div class="anime-image-container">
                <img class="anime-image" 
                     src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}" 
                     alt="${anime.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x400/333/fff?text=No+Image'">
                
                ${showOverlay ? `
                    <div class="anime-overlay">
                        <button class="play-button" aria-label="View Details">
                            <span class="material-icons">play_arrow</span>
                        </button>
                    </div>
                ` : ''}
                
                <div class="anime-score">
                    <span class="material-icons">star</span>
                    ${score}
                </div>
                
                ${showFavorite ? `
                    <button class="anime-favorite ${isFavorite ? 'active' : ''}" 
                            data-anime-id="${anime.mal_id}"
                            aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites">
                        <span class="material-icons">${isFavorite ? 'favorite' : 'favorite_border'}</span>
                    </button>
                ` : ''}
            </div>
            
            <div class="anime-info">
                <h3 class="anime-title">${anime.title}</h3>
                ${anime.title_english && anime.title_english !== anime.title ? 
                    `<p class="anime-title-english">${anime.title_english}</p>` : ''
                }
                
                <div class="anime-meta">
                    <div class="meta-item">
                        <span class="material-icons">calendar_today</span>
                        <span>${year}</span>
                    </div>
                    <div class="meta-item">
                        <span class="material-icons">tv</span>
                        <span>${type}</span>
                    </div>
                    <div class="meta-item">
                        <span class="material-icons">episode</span>
                        <span>${episodes} eps</span>
                    </div>
                </div>
                
                ${genres.length > 0 ? `
                    <div class="anime-genres">
                        ${genres.map(genre => `
                            <span class="genre-tag" data-genre="${genre.name}">${genre.name}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <p class="anime-synopsis">${synopsis}</p>
                
                <div class="anime-actions">
                    <button class="btn-anime-action" data-action="details">
                        <span class="material-icons info-details">info</span>
                        Details
                    </button>
                    <span class="meta-item">
                        <span class="material-icons">info</span>
                        <span>${status}</span>
                    </span>
                </div>
            </div>
        `;

        // Add click handler
        if (onClick) {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.anime-favorite') && !e.target.closest('.genre-tag')) {
                    onClick(anime);
                }
            });
        } else {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.anime-favorite') && !e.target.closest('.genre-tag')) {
                    this.navigateToAnime(anime.mal_id);
                }
            });
        }

        // Add favorite toggle handler
        const favoriteBtn = card.querySelector('.anime-favorite');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(anime, favoriteBtn);
            });
        }

        // Add genre click handlers
        card.querySelectorAll('.genre-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const genre = tag.dataset.genre;
                this.filterByGenre(genre);
            });
        });

        return card;
    }

    /**
     * Create featured card component
     */
    createFeaturedCard(anime) {
        const score = anime.score || 'N/A';
        const year = anime.aired?.prop?.from?.year || anime.year || 'Unknown';
        const type = anime.type || 'Unknown';
        const episodes = anime.episodes || '?';
        
        let synopsis = anime.synopsis || 'No description available.';
        if (synopsis.length > 200) {
            synopsis = synopsis.substring(0, 200) + '...';
        }

        const card = document.createElement('div');
        card.className = 'featured-card';
        card.setAttribute('data-anime-id', anime.mal_id);

        card.innerHTML = `
            <img class="featured-image" 
                 src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}" 
                 alt="${anime.title}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/800x400/333/fff?text=No+Image'">
            
            <div class="featured-info">
                <h2 class="featured-title">${anime.title}</h2>
                <div class="featured-meta">
                    <div class="meta-item">
                        <span class="material-icons">star</span>
                        <span>${score}</span>
                    </div>
                    <div class="meta-item">
                        <span class="material-icons">calendar_today</span>
                        <span>${year}</span>
                    </div>
                    <div class="meta-item">
                        <span class="material-icons">tv</span>
                        <span>${type}</span>
                    </div>
                    <div class="meta-item">
                        <span class="material-icons">episode</span>
                        <span>${episodes} eps</span>
                    </div>
                </div>
                <p class="featured-description">${synopsis}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            this.navigateToAnime(anime.mal_id);
        });

        return card;
    }

    /**
     * Create character card component
     */
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';

        const name = character.character?.name || 'Unknown';
        const role = character.role || 'Unknown';
        const image = character.character?.images?.jpg?.image_url || 
                     'https://via.placeholder.com/200x200/333/fff?text=No+Image';

        card.innerHTML = `
            <img class="character-image" 
                 src="${image}" 
                 alt="${name}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=No+Image'">
            
            <div class="character-info">
                <h4 class="character-name">${name}</h4>
                <p class="character-role">${role}</p>
            </div>
        `;

        return card;
    }

    /**
     * Create skeleton loading card
     */
    createSkeletonCard() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        
        skeleton.innerHTML = `
            <div class="skeleton-image skeleton"></div>
            <div class="skeleton-content">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton short"></div>
            </div>
        `;
        
        return skeleton;
    }

    /**
     * Create search suggestion item
     */
    createSuggestionItem(anime) {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.setAttribute('data-anime-id', anime.mal_id);

        const year = anime.year || 'Unknown';
        const type = anime.type || 'Unknown';
        const score = anime.score || 'N/A';

        item.innerHTML = `
            <img class="suggestion-image" 
                 src="${anime.image || 'https://via.placeholder.com/40x60/333/fff?text=?'}" 
                 alt="${anime.title}"
                 loading="lazy">
            
            <div class="suggestion-info">
                <h6>${anime.title}</h6>
                <p>${year} • ${type} • ⭐ ${score}</p>
            </div>
        `;

        item.addEventListener('click', () => {
            this.navigateToAnime(anime.mal_id);
            this.hideSuggestions();
        });

        return item;
    }

    /**
     * Create showcase card component for hero section
     */
    createShowcaseCard(anime) {
        const card = document.createElement('div');
        card.className = 'showcase-card';
        card.setAttribute('data-anime-id', anime.mal_id);

        const score = anime.score || 'N/A';
        const type = anime.type || 'Unknown';

        card.innerHTML = `
            <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x200/333/fff?text=No+Image'}" 
                 alt="${anime.title}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=No+Image'">
            <div class="showcase-info">
                <h6>${anime.title}</h6>
                <p>⭐ ${score} • ${type}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            this.navigateToAnime(anime.mal_id);
        });

        return card;
    }

    /**
     * Show loading skeleton cards
     */
    showLoadingCards(container, count = 12) {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < count; i++) {
            fragment.appendChild(this.createSkeletonCard());
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * Show loading state
     */
    showLoading(containerId) {
        this.loadingStates.add(containerId);
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(containerId = null) {
        if (containerId) {
            this.loadingStates.delete(containerId);
        } else {
            this.loadingStates.clear();
        }
        
        if (this.loadingStates.size === 0) {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''} show`;
        
        const toastId = `toast-${Date.now()}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="material-icons me-2">
                    ${type === 'success' ? 'check_circle' : 
                      type === 'error' ? 'error' : 
                      type === 'warning' ? 'warning' : 'info'}
                </span>
                <strong class="me-auto">AnimeVault</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();

        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(anime, button) {
        const isFavorite = storage.isFavorite(anime.mal_id);
        
        if (isFavorite) {
            if (storage.removeFavorite(anime.mal_id)) {
                button.classList.remove('active');
                button.innerHTML = '<span class="material-icons">favorite_border</span>';
                button.setAttribute('aria-label', 'Add to favorites');
                this.showToast(`Removed "${anime.title}" from favorites`, 'info');
                this.updateFavoritesCount();
            }
        } else {
            if (storage.addFavorite(anime)) {
                button.classList.add('active');
                button.innerHTML = '<span class="material-icons">favorite</span>';
                button.setAttribute('aria-label', 'Remove from favorites');
                this.showToast(`Added "${anime.title}" to favorites`, 'success');
                this.updateFavoritesCount();
            } else {
                this.showToast('Failed to add to favorites', 'error');
            }
        }
    }

    /**
     * Update favorites count in navigation
     */
    updateFavoritesCount() {
        const count = storage.getFavoriteCount();
        const badge = document.getElementById('favoritesCount');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Navigate to anime detail page
     */
    navigateToAnime(animeId) {
        window.location.href = `anime-detail.html?id=${animeId}`;
    }

    /**
     * Filter by genre
     */
    filterByGenre(genre) {
        // Trigger genre filter in main app
        const event = new CustomEvent('genreFilter', { detail: { genre } });
        document.dispatchEvent(event);
        
        // Update active filter button
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-genre="${genre}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    /**
     * Hide search suggestions
     */
    hideSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    /**
     * Lazy load images
     */
    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Smooth scroll to element
     */
    scrollTo(elementId, offset = 80) {
        const element = document.getElementById(elementId);
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Handle back to top functionality
     */
    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Initialize navbar scroll effect
     */
    initNavbarScroll() {
        const navbar = document.getElementById('mainNavbar');
        if (!navbar) return;

        const handleScroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll);
    }

    /**
     * Initialize search functionality
     */
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (!searchInput || !searchBtn || !suggestionsContainer) return;

        let searchTimeout;
        let currentQuery = '';

        const performSearch = (query) => {
            if (query.trim() === '') return;
            
            storage.addSearchTerm(query);
            const event = new CustomEvent('search', { detail: { query } });
            document.dispatchEvent(event);
            this.hideSuggestions();
        };

        const showSuggestions = async (query) => {
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }

            currentQuery = query;
            const result = await jikanAPI.getSearchSuggestions(query);
            
            if (result.success && currentQuery === query) {
                const suggestions = result.data.data;
                
                if (suggestions.length > 0) {
                    suggestionsContainer.innerHTML = '';
                    suggestions.forEach(anime => {
                        suggestionsContainer.appendChild(this.createSuggestionItem(anime));
                    });
                    suggestionsContainer.style.display = 'block';
                } else {
                    this.hideSuggestions();
                }
            }
        };

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            searchTimeout = setTimeout(() => {
                showSuggestions(query);
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(searchInput.value);
            } else if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        });

        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    /**
     * Initialize all UI components
     */
    init() {
        this.updateFavoritesCount();
        this.initBackToTop();
        this.initNavbarScroll();
        this.initSearch();
        this.observeElements();
    }
}

// Create global instance
const uiComponents = new UIComponents();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        uiComponents.init();
    });
} else {
    uiComponents.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}

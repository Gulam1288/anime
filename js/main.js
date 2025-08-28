/**
 * Main Application Logic for AnimeVault Homepage
 * Handles trending anime, search, filtering, and user interactions
 */

class AnimeVaultApp {
    constructor() {
        this.currentPage = 1;
        this.currentGenre = 'all';
        this.currentSearchQuery = '';
        this.isLoading = false;
        this.hasMoreData = true;
        this.featuredSwiper = null;
        this.currentSection = 'trending';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize AOS animation library
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 600,
                    offset: 100,
                    once: true
                });
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial content
            await this.loadInitialContent();
            
            // Initialize components
            this.initializeComponents();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application');
        }
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Search functionality
        document.addEventListener('search', (e) => {
            this.handleSearch(e.detail.query);
        });

        // Genre filtering
        document.addEventListener('genreFilter', (e) => {
            this.handleGenreFilter(e.detail.genre);
        });

        // Genre filter buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genre = e.target.dataset.genre;
                this.handleGenreFilter(genre);
            });
        });

        // Hero action buttons
        const exploreBtn = document.getElementById('exploreBtn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                uiComponents.scrollTo('trending');
            });
        }

        const trendingBtn = document.getElementById('trendingBtn');
        if (trendingBtn) {
            trendingBtn.addEventListener('click', () => {
                uiComponents.scrollTo('trending');
            });
        }

        // Load more buttons
        const loadMoreTrending = document.getElementById('loadMoreTrending');
        if (loadMoreTrending) {
            loadMoreTrending.addEventListener('click', () => {
                this.loadMoreTrending();
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    this.showSection(sectionId);
                    uiComponents.scrollTo(sectionId);
                }
            });
        });

        // Favorites button
        const favoritesBtn = document.getElementById('favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                this.showSection('favorites');
                uiComponents.scrollTo('favorites');
            });
        }

        // Infinite scroll
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    /**
     * Load initial content for the homepage
     */
    async loadInitialContent() {
        uiComponents.showLoading('initial');

        try {
            // Load hero showcase
            await this.loadHeroShowcase();
            
            // Load featured carousel
            await this.loadFeaturedCarousel();
            
            // Load trending anime
            await this.loadTrendingAnime();
            
            // Load genre content
            await this.loadGenreContent();
            
        } catch (error) {
            console.error('Error loading initial content:', error);
            this.showError('Failed to load content');
        } finally {
            uiComponents.hideLoading('initial');
        }
    }

    /**
     * Load hero showcase with random popular anime
     */
    async loadHeroShowcase() {
        const showcase = document.getElementById('heroShowcase');
        if (!showcase) return;

        try {
            const result = await jikanAPI.getPopularAnime(1, 4);
            
            if (result.success && result.data.data) {
                const fragment = document.createDocumentFragment();
                
                result.data.data.forEach(anime => {
                    const card = uiComponents.createShowcaseCard(anime);
                    fragment.appendChild(card);
                });
                
                showcase.innerHTML = '';
                showcase.appendChild(fragment);
            }
        } catch (error) {
            console.error('Error loading hero showcase:', error);
        }
    }



    /**
     * Load featured carousel with top anime
     */
    async loadFeaturedCarousel() {
        const carousel = document.getElementById('featuredCarousel');
        try {
            const result = await jikanAPI.getTopAnime('', '', 1, 10);
            
            if (result.success && result.data.data) {
                const fragment = document.createDocumentFragment();
                
                result.data.data.forEach(anime => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.appendChild(uiComponents.createFeaturedCard(anime));
                    fragment.appendChild(slide);
                });
                
                carousel.innerHTML = '';
                carousel.appendChild(fragment);
                
                // Initialize Swiper
                this.initFeaturedSwiper();
            }
        } catch (error) {
            console.error('Error loading featured carousel:', error);
            this.showCarouselFallback(carousel);
        }
    }

    /**
     * Initialize featured Swiper carousel
     */
    initFeaturedSwiper() {
        if (typeof Swiper !== 'undefined') {
            this.featuredSwiper = new Swiper('.featured-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                centeredSlides: true,
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        centeredSlides: false,
                    },
                    1024: {
                        slidesPerView: 3,
                        centeredSlides: false,
                    }
                }
            });
        }
    }

    /**
     * Load trending anime
     */
    async loadTrendingAnime(page = 1, append = false) {
        const grid = document.getElementById('trendingGrid');
        if (!grid) return;

        if (!append) {
            this.isLoading = true;
            uiComponents.showLoadingCards(grid);
        }

        try {
            // Fetch two pages to get up to 50 unique anime
            const [result1, result2] = await Promise.all([
                jikanAPI.getTrendingAnime(page),
                jikanAPI.getTrendingAnime(page + 1)
            ]);

            let anime = [];
            if (result1.success && result1.data.data) {
                anime = anime.concat(result1.data.data);
            }
            if (result2.success && result2.data.data) {
                anime = anime.concat(result2.data.data);
            }

            // Filter out duplicates by mal_id
            const uniqueAnimeMap = {};
            anime.forEach(item => {
                uniqueAnimeMap[item.mal_id] = item;
            });
            const uniqueAnime = Object.values(uniqueAnimeMap).slice(0, 60);

            if (uniqueAnime.length > 0) {
                if (append) {
                    this.appendAnimeCards(grid, uniqueAnime);
                } else {
                    this.displayAnimeCards(grid, uniqueAnime);
                }

                this.hasMoreData = uniqueAnime.length === 60;
                this.currentPage = page;
            } else {
                this.showError('Failed to load trending anime');
            }
        } catch (error) {
            console.error('Error loading trending anime:', error);
            this.showError('Failed to load trending anime');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load genre-based content
     */
    async loadGenreContent(genre = 'all', page = 1, append = false) {
        const grid = document.getElementById('genreGrid');
        if (!grid) return;

        if (!append) {
            this.isLoading = true;
            uiComponents.showLoadingCards(grid);
        }

        try {
            let result;
            
            if (genre === 'all') {
                result = await jikanAPI.getPopularAnime(page);
            } else {
                // Get genre ID from predefined mapping
                const genreId = this.getGenreId(genre);
                if (genreId) {
                    result = await jikanAPI.getAnimeByGenre(genreId, page);
                } else {
                    // Fallback to search by genre name
                    result = await jikanAPI.searchAnime(genre, page);
                }
            }
            
            if (result.success && result.data.data) {
                const anime = result.data.data;
                
                if (append) {
                    this.appendAnimeCards(grid, anime);
                } else {
                    this.displayAnimeCards(grid, anime);
                }
                
                this.hasMoreData = anime.length === 25;
                this.currentPage = page;
                this.currentGenre = genre;
                
            } else {
                this.showError(`Failed to load ${genre} anime`);
            }
        } catch (error) {
            console.error('Error loading genre content:', error);
            this.showError(`Failed to load ${genre} anime`);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle search functionality
     */
    async handleSearch(query) {
        if (!query || query.trim() === '') return;

        this.currentSearchQuery = query.trim();
        this.currentSection = 'search';
        
        const searchSection = document.getElementById('searchResults');
        const searchGrid = document.getElementById('searchGrid');
        const searchDesc = document.getElementById('searchResultsDesc');
        
        if (!searchSection || !searchGrid) return;

        // Show search section
        this.showSection('searchResults');
        
        // Update description
        if (searchDesc) {
            searchDesc.textContent = `Search results for "${query}"`;
        }

        // Show loading
        uiComponents.showLoadingCards(searchGrid);

        try {
            const result = await jikanAPI.searchAnime(query);
            
            if (result.success && result.data.data) {
                const anime = result.data.data;
                
                if (anime.length > 0) {
                    this.displayAnimeCards(searchGrid, anime);
                    
                    if (searchDesc) {
                        searchDesc.textContent = `Found ${anime.length} results for "${query}"`;
                    }
                } else {
                    this.showEmptyState(searchGrid, 'No Results Found', `No anime found for "${query}". Try a different search term.`);
                }
            } else {
                this.showError('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('Error searching anime:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    /**
     * Handle genre filtering
     */
    handleGenreFilter(genre) {
        this.currentGenre = genre;
        this.currentPage = 1;
        this.currentSection = 'genres';
        
        // Update active button
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.genre === genre);
        });
        
        // Show genre section
        this.showSection('genres');
        
        // Load content
        this.loadGenreContent(genre);
    }

    /**
     * Load more trending anime
     */
    async loadMoreTrending() {
        if (this.isLoading || !this.hasMoreData) return;
        
        const nextPage = this.currentPage + 1;
        await this.loadTrendingAnime(nextPage, true);
    }

    /**
     * Handle infinite scroll
     */
    handleScroll() {
        if (this.isLoading || !this.hasMoreData) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.offsetHeight;
        
        if (scrollTop + windowHeight >= docHeight - 1000) {
            if (this.currentSection === 'trending') {
                this.loadMoreTrending();
            } else if (this.currentSection === 'genres' && this.currentGenre !== 'all') {
                this.loadMoreGenreContent();
            }
        }
    }

    /**
     * Load more genre content
     */
    async loadMoreGenreContent() {
        if (this.isLoading || !this.hasMoreData) return;
        
        const nextPage = this.currentPage + 1;
        await this.loadGenreContent(this.currentGenre, nextPage, true);
    }

    /**
     * Display anime cards in container
     */
    displayAnimeCards(container, animeList) {
        const fragment = document.createDocumentFragment();
        
        animeList.forEach(anime => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col';
            cardCol.appendChild(uiComponents.createAnimeCard(anime));
            fragment.appendChild(cardCol);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Observe new elements for animations
        uiComponents.observeElements();
    }

    /**
     * Append anime cards to container
     */
    appendAnimeCards(container, animeList) {
        const fragment = document.createDocumentFragment();
        
        animeList.forEach(anime => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col';
            cardCol.appendChild(uiComponents.createAnimeCard(anime));
            fragment.appendChild(cardCol);
        });
        
        container.appendChild(fragment);
        
        // Observe new elements for animations
        uiComponents.observeElements();
    }

    /**
     * Show specific section
     */
    showSection(sectionId) {
        // Hide all sections
        const sections = ['searchResults', 'favorites'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.style.display = 'none';
            }
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Load favorites if showing favorites section
            if (sectionId === 'favorites') {
                this.loadFavorites();
            }
        }
        
        // Update navigation
        this.updateNavigation(sectionId);
    }

    /**
     * Update navigation active states
     */
    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Load user favorites
     */
    loadFavorites() {
        const favoritesGrid = document.getElementById('favoritesGrid');
        const emptyFavorites = document.getElementById('emptyFavorites');
        
        if (!favoritesGrid) return;

        const favorites = storage.getFavorites();
        
        if (favorites.length > 0) {
            this.displayAnimeCards(favoritesGrid, favorites);
            
            if (emptyFavorites) {
                emptyFavorites.style.display = 'none';
            }
        } else {
            favoritesGrid.innerHTML = '';
            
            if (emptyFavorites) {
                emptyFavorites.style.display = 'block';
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        uiComponents.showToast(message, 'error');
    }

    /**
     * Show empty state
     */
    showEmptyState(container, title, description) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <span class="material-icons empty-icon">search_off</span>
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show carousel fallback content
     */
    showCarouselFallback(container) {
        const fallbackAnime = [
            { mal_id: 16498, title: "Attack on Titan", image_url: "https://cdn.myanimelist.net/images/anime/10/47347.jpg", score: 9.0, synopsis: "Humanity fights for survival against giant humanoid Titans." },
            { mal_id: 5114, title: "Fullmetal Alchemist: Brotherhood", image_url: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg", score: 9.1, synopsis: "Brothers search for the Philosopher's Stone to restore their bodies." },
            { mal_id: 1535, title: "Death Note", image_url: "https://cdn.myanimelist.net/images/anime/9/9453.jpg", score: 9.0, synopsis: "A high school student gains the power to kill anyone by writing their name." },
            { mal_id: 20, title: "Naruto", image_url: "https://cdn.myanimelist.net/images/anime/13/17405.jpg", score: 8.3, synopsis: "A young ninja's journey to become the strongest ninja and leader of his village." },
        ];

        const fragment = document.createDocumentFragment();
        
        fallbackAnime.forEach(anime => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            const animeData = {
                mal_id: anime.mal_id,
                title: anime.title,
                images: { jpg: { large_image_url: anime.image_url } },
                score: anime.score,
                synopsis: anime.synopsis,
                type: 'TV',
                year: null
            };
            
            slide.appendChild(uiComponents.createFeaturedCard(animeData));
            fragment.appendChild(slide);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Initialize Swiper with fallback content
        this.initFeaturedSwiper();
    }

    /**
     * Update load more button state
     */
    updateLoadMoreButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (this.hasMoreData && !this.isLoading) {
            button.style.display = 'block';
            button.disabled = false;
            button.innerHTML = '<span class="material-icons me-2">expand_more</span>Load More';
        } else if (this.isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        } else {
            button.style.display = 'none';
        }
    }

    /**
     * Get genre ID from genre name
     */
    getGenreId(genreName) {
        const genreMap = {
            'action': 1,
            'adventure': 2,
            'comedy': 4,
            'drama': 8,
            'fantasy': 10,
            'romance': 22,
            'slice_of_life': 36,
            'supernatural': 37
        };
        
        return genreMap[genreName.toLowerCase()] || null;
    }

    /**
     * Initialize additional components
     */
    initializeComponents() {
        // Initialize character swiper if exists
        if (typeof Swiper !== 'undefined') {
            const charactersSwiper = document.querySelector('.characters-swiper');
            if (charactersSwiper) {
                new Swiper('.characters-swiper', {
                    slidesPerView: 2,
                    spaceBetween: 20,
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    breakpoints: {
                        576: {
                            slidesPerView: 3,
                        },
                        768: {
                            slidesPerView: 4,
                        },
                        1024: {
                            slidesPerView: 6,
                        }
                    }
                });
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AnimeVaultApp();
    
    // Make app globally available for debugging
    window.animeVaultApp = app;
});

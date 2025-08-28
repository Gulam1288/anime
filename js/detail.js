/**
 * Anime Detail Page Logic for AnimeVault
 * Handles detailed anime information, characters, and recommendations
 */

class AnimeDetailPage {
    constructor() {
        this.animeId = null;
        this.animeData = null;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Initialize the detail page
     */
    async init() {
        try {
            // Get anime ID from URL
            this.animeId = this.getAnimeIdFromURL();
            
            if (!this.animeId) {
                this.showError('No anime ID provided');
                return;
            }

            // Initialize AOS
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 600,
                    offset: 100,
                    once: true
                });
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Load anime details
            await this.loadAnimeDetails();
            
        } catch (error) {
            console.error('Error initializing detail page:', error);
            this.showError('Failed to load anime details');
        }
    }

    /**
     * Get anime ID from URL parameters
     */
    getAnimeIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Favorite toggle button
        const favoriteToggle = document.getElementById('favoriteToggle');
        if (favoriteToggle) {
            favoriteToggle.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }

        // Add to favorites button
        const addToFavorites = document.getElementById('addToFavorites');
        if (addToFavorites) {
            addToFavorites.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }

        // Back to top functionality
        uiComponents.initBackToTop();
    }

    /**
     * Load complete anime details
     */
    async loadAnimeDetails() {
        uiComponents.showLoading('detail');

        try {
            // Load main anime data
            const result = await jikanAPI.getAnimeFullById(this.animeId);
            
            if (!result.success || !result.data.data) {
                throw new Error('Failed to load anime data');
            }

            this.animeData = result.data.data;
            
            // Add to view history
            storage.addToViewHistory(this.animeData);
            
            // Display anime details
            this.displayAnimeDetails();
            
            // Load additional content
            await Promise.all([
                this.loadCharacters(),
                this.loadRecommendations(),
                this.loadRelatedAnime()
            ]);
            
            // Show content
            this.showContent();
            
        } catch (error) {
            console.error('Error loading anime details:', error);
            this.showError('Failed to load anime details');
        } finally {
            uiComponents.hideLoading('detail');
        }
    }

    /**
     * Display main anime details
     */
    displayAnimeDetails() {
        const anime = this.animeData;
        
        // Update page title
        document.title = `${anime.title} - AnimeVault`;
        
        // Set hero background
        const heroBackground = document.getElementById('heroBackground');
        if (heroBackground) {
            const bgImage = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            if (bgImage) {
                heroBackground.style.backgroundImage = `url(${bgImage})`;
                heroBackground.style.backgroundSize = 'cover';
                heroBackground.style.backgroundPosition = 'center';
            }
        }

        // Set poster image
        const posterImg = document.getElementById('animePoster');
        if (posterImg) {
            posterImg.src = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            posterImg.alt = anime.title;
            posterImg.onerror = () => {
                posterImg.src = 'https://via.placeholder.com/300x400/333/fff?text=No+Image';
            };
        }

        // Set title information
        this.setTextContent('animeTitle', anime.title);
        this.setTextContent('animeTitleEnglish', anime.title_english);
        this.setTextContent('animeSynopsis', anime.synopsis);

        // Set meta information
        this.setTextContent('animeScore', anime.score ? `${anime.score}/10` : 'N/A');
        this.setTextContent('animeYear', anime.aired?.prop?.from?.year || 'Unknown');
        this.setTextContent('animeEpisodes', anime.episodes ? `${anime.episodes} episodes` : 'Unknown');
        this.setTextContent('animeDuration', anime.duration || 'Unknown');
        this.setTextContent('animeStatus', anime.status || 'Unknown');
        this.setTextContent('animeType', anime.type || 'Unknown');
        this.setTextContent('animeSource', anime.source || 'Unknown');
        this.setTextContent('animeRating', anime.rating || 'Unknown');
        this.setTextContent('animeRank', anime.rank ? `#${anime.rank}` : 'Unranked');

        // Set aired information
        let airedText = 'Unknown';
        if (anime.aired?.string) {
            airedText = anime.aired.string;
        } else if (anime.aired?.from) {
            airedText = new Date(anime.aired.from).toLocaleDateString();
        }
        this.setTextContent('animeAired', airedText);

        // Set studios
        const studios = anime.studios?.map(studio => studio.name).join(', ') || 'Unknown';
        this.setTextContent('animeStudios', studios);

        // Set genres
        this.displayGenres(anime.genres);

        // Set statistics
        this.displayStatistics(anime);

        // Update favorite button state
        this.updateFavoriteButtons();
    }

    /**
     * Display genres as tags
     */
    displayGenres(genres) {
        const genresContainer = document.getElementById('animeGenres');
        if (!genresContainer || !genres) return;

        const fragment = document.createDocumentFragment();
        
        genres.forEach(genre => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = genre.name;
            tag.addEventListener('click', () => {
                window.location.href = `index.html#genres`;
            });
            fragment.appendChild(tag);
        });

        genresContainer.innerHTML = '';
        genresContainer.appendChild(fragment);
    }

    /**
     * Display statistics and scores
     */
    displayStatistics(anime) {
        // Score bar
        const scoreFill = document.getElementById('scoreFill');
        const scoreValue = document.getElementById('scoreValue');
        if (scoreFill && scoreValue && anime.score) {
            const percentage = (anime.score / 10) * 100;
            scoreFill.style.width = `${percentage}%`;
            scoreValue.textContent = `${anime.score}/10`;
        }

        // Popularity
        this.setTextContent('popularityValue', anime.popularity ? `#${anime.popularity}` : 'Unknown');

        // Members
        this.setTextContent('membersValue', anime.members ? this.formatNumber(anime.members) : 'Unknown');
    }

    /**
     * Load anime characters
     */
    async loadCharacters() {
        const charactersContainer = document.getElementById('charactersContainer');
        if (!charactersContainer) return;

        try {
            const result = await jikanAPI.getAnimeCharacters(this.animeId);
            
            if (result.success && result.data.data) {
                const characters = result.data.data.slice(0, 12); // Limit to first 12 characters
                const fragment = document.createDocumentFragment();
                
                characters.forEach(character => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.appendChild(uiComponents.createCharacterCard(character));
                    fragment.appendChild(slide);
                });
                
                charactersContainer.innerHTML = '';
                charactersContainer.appendChild(fragment);
                
                // Initialize characters swiper
                this.initCharactersSwiper();
            }
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    /**
     * Load anime recommendations
     */
    async loadRecommendations() {
        const recommendationsContainer = document.getElementById('recommendationsContainer');
        if (!recommendationsContainer) return;

        try {
            const result = await jikanAPI.getAnimeRecommendations(this.animeId);
            
            if (result.success && result.data.data && result.data.data.length > 0) {
                const recommendations = result.data.data.slice(0, 6); // Limit to 6 recommendations
                const fragment = document.createDocumentFragment();
                
                recommendations.forEach(rec => {
                    if (rec.entry) {
                        const col = document.createElement('div');
                        col.className = 'col-lg-4 col-md-6 mb-4';
                        col.appendChild(uiComponents.createAnimeCard(rec.entry));
                        fragment.appendChild(col);
                    }
                });
                
                recommendationsContainer.innerHTML = '';
                recommendationsContainer.appendChild(fragment);
                
                // Refresh AOS for new content
                setTimeout(() => {
                    if (typeof AOS !== 'undefined') {
                        AOS.refresh();
                    }
                }, 100);
            } else {
                // Try to load similar anime by genre as fallback
                await this.loadSimilarAnimeByGenre(recommendationsContainer);
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            await this.loadSimilarAnimeByGenre(recommendationsContainer);
        }
    }

    /**
     * Load related anime
     */
    async loadRelatedAnime() {
        const relatedContainer = document.getElementById('relatedAnime');
        if (!relatedContainer) return;

        try {
            // Check if anime data has relations
            if (!this.animeData.relations || this.animeData.relations.length === 0) {
                this.showEmptySection(relatedContainer, 'No related anime available.');
                return;
            }

            const fragment = document.createDocumentFragment();
            const relatedPromises = [];
            
            // Get related anime from relations
            this.animeData.relations.forEach(relation => {
                if (relation.entry && relation.entry.length > 0) {
                    relation.entry.slice(0, 2).forEach(entry => {
                        if (entry.type === 'anime') {
                            relatedPromises.push(
                                jikanAPI.getAnimeById(entry.mal_id)
                                    .then(result => {
                                        if (result.success && result.data.data) {
                                            const col = document.createElement('div');
                                            col.className = 'col-lg-4 col-md-6 mb-4';
                                            col.appendChild(uiComponents.createAnimeCard(result.data.data));
                                            fragment.appendChild(col);
                                        }
                                    })
                                    .catch(err => console.error('Error loading related anime:', err))
                            );
                        }
                    });
                }
            });
            
            if (relatedPromises.length > 0) {
                await Promise.all(relatedPromises.slice(0, 6)); // Limit to 6 related anime
                
                if (fragment.children.length > 0) {
                    relatedContainer.innerHTML = '';
                    relatedContainer.appendChild(fragment);
                    
                    // Refresh AOS for new content
                    setTimeout(() => {
                        if (typeof AOS !== 'undefined') {
                            AOS.refresh();
                        }
                    }, 100);
                } else {
                    await this.loadSimilarAnimeByGenre(relatedContainer);
                }
            } else {
                await this.loadSimilarAnimeByGenre(relatedContainer);
            }
            
        } catch (error) {
            console.error('Error loading related anime:', error);
            await this.loadSimilarAnimeByGenre(relatedContainer);
        }
    }

    /**
     * Load similar anime by genre as fallback for recommendations/related
     */
    async loadSimilarAnimeByGenre(container) {
        try {
            // Get anime of similar genre if available
            if (this.animeData.genres && this.animeData.genres.length > 0) {
                const genreId = this.animeData.genres[0].mal_id;
                const result = await jikanAPI.getAnimeByGenre(genreId, 1, 6);
                
                if (result.success && result.data.data && result.data.data.length > 0) {
                    const fragment = document.createDocumentFragment();
                    
                    result.data.data.slice(0, 6).forEach(anime => {
                        // Skip the current anime
                        if (anime.mal_id !== this.animeId) {
                            const col = document.createElement('div');
                            col.className = 'col-lg-4 col-md-6 mb-4';
                            col.appendChild(uiComponents.createAnimeCard(anime));
                            fragment.appendChild(col);
                        }
                    });
                    
                    if (fragment.children.length > 0) {
                        container.innerHTML = '';
                        container.appendChild(fragment);
                        
                        // Add genre message
                        const genreMessage = document.createElement('div');
                        genreMessage.className = 'col-12 mt-3';
                        genreMessage.innerHTML = `
                            <div class="text-center text-muted">
                                <small><em>Similar ${this.animeData.genres[0].name} anime</em></small>
                            </div>
                        `;
                        container.appendChild(genreMessage);
                        
                        // Refresh AOS
                        setTimeout(() => {
                            if (typeof AOS !== 'undefined') {
                                AOS.refresh();
                            }
                        }, 100);
                        return;
                    }
                }
            }
            
            // If genre-based search fails, show popular fallback
            this.showFallbackRecommendations(container);
            
        } catch (error) {
            console.error('Error loading similar anime by genre:', error);
            this.showFallbackRecommendations(container);
        }
    }

    /**
     * Show empty section message
     */
    showEmptySection(container, message) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-5">
                    <span class="material-icons mb-3" style="font-size: 3rem;">info</span>
                    <p class="mb-0">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Initialize characters swiper
     */
    initCharactersSwiper() {
        if (typeof Swiper !== 'undefined') {
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

    /**
     * Toggle favorite status
     */
    toggleFavorite() {
        if (!this.animeData) return;

        const isFavorite = storage.isFavorite(this.animeData.mal_id);
        
        if (isFavorite) {
            if (storage.removeFavorite(this.animeData.mal_id)) {
                uiComponents.showToast(`Removed "${this.animeData.title}" from favorites`, 'info');
                this.updateFavoriteButtons();
                uiComponents.updateFavoritesCount();
            }
        } else {
            if (storage.addFavorite(this.animeData)) {
                uiComponents.showToast(`Added "${this.animeData.title}" to favorites`, 'success');
                this.updateFavoriteButtons();
                uiComponents.updateFavoritesCount();
            } else {
                uiComponents.showToast('Failed to add to favorites', 'error');
            }
        }
    }

    /**
     * Update favorite button states
     */
    updateFavoriteButtons() {
        if (!this.animeData) return;

        const isFavorite = storage.isFavorite(this.animeData.mal_id);
        
        // Update nav favorite toggle
        const favoriteToggle = document.getElementById('favoriteToggle');
        if (favoriteToggle) {
            const icon = favoriteToggle.querySelector('.material-icons');
            if (icon) {
                icon.textContent = isFavorite ? 'favorite' : 'favorite_border';
            }
            favoriteToggle.setAttribute('title', 
                isFavorite ? 'Remove from Favorites' : 'Add to Favorites'
            );
        }

        // Update poster action button
        const addToFavorites = document.getElementById('addToFavorites');
        if (addToFavorites) {
            const icon = addToFavorites.querySelector('.material-icons');
            if (icon) {
                icon.textContent = isFavorite ? 'favorite' : 'favorite';
            }
            addToFavorites.innerHTML = `
                <span class="material-icons me-2">${isFavorite ? 'favorite' : 'favorite'}</span>
                ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            `;
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        const errorState = document.getElementById('errorState');
        const animeContent = document.getElementById('animeContent');
        
        if (errorState) {
            errorState.style.display = 'block';
        }
        
        if (animeContent) {
            animeContent.style.display = 'none';
        }
        
        uiComponents.showToast(message, 'error');
    }

    /**
     * Show anime content
     */
    showContent() {
        const errorState = document.getElementById('errorState');
        const animeContent = document.getElementById('animeContent');
        
        if (errorState) {
            errorState.style.display = 'none';
        }
        
        if (animeContent) {
            animeContent.style.display = 'block';
        }
        
        // Trigger AOS refresh for new content
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    /**
     * Utility method to safely set text content
     */
    setTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text || 'Unknown';
        }
    }

    /**
     * Format large numbers with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Show empty section message
     */
    showEmptySection(container, message) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-5">
                    <span class="material-icons mb-3" style="font-size: 3rem;">info</span>
                    <p class="mb-0">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show fallback recommendations when API fails
     */
    showFallbackRecommendations(container) {
        const fallbackAnime = [
            { mal_id: 16498, title: "Attack on Titan", image_url: "https://cdn.myanimelist.net/images/anime/10/47347.jpg", score: 9.0 },
            { mal_id: 11757, title: "Sword Art Online", image_url: "https://cdn.myanimelist.net/images/anime/11/39717.jpg", score: 7.2 },
            { mal_id: 20, title: "Naruto", image_url: "https://cdn.myanimelist.net/images/anime/13/17405.jpg", score: 8.3 },
            { mal_id: 1535, title: "Death Note", image_url: "https://cdn.myanimelist.net/images/anime/9/9453.jpg", score: 9.0 },
            { mal_id: 5114, title: "Fullmetal Alchemist: Brotherhood", image_url: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg", score: 9.1 },
            { mal_id: 31964, title: "Boku no Hero Academia", image_url: "https://cdn.myanimelist.net/images/anime/10/78745.jpg", score: 7.9 }
        ];

        const fragment = document.createDocumentFragment();
        
        fallbackAnime.slice(0, 6).forEach(anime => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            
            const animeData = {
                mal_id: anime.mal_id,
                title: anime.title,
                images: {
                    jpg: { image_url: anime.image_url }
                },
                score: anime.score,
                type: 'TV',
                year: null
            };
            
            col.appendChild(uiComponents.createAnimeCard(animeData));
            fragment.appendChild(col);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Add fallback message
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'col-12 mt-3';
        fallbackMessage.innerHTML = `
            <div class="text-center text-muted">
                <small><em>Showing popular anime (recommendations temporarily unavailable)</em></small>
            </div>
        `;
        container.appendChild(fallbackMessage);
        
        // Refresh AOS for new content
        setTimeout(() => {
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }, 100);
    }
}

// Initialize detail page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const detailPage = new AnimeDetailPage();
    
    // Make detail page globally available for debugging
    window.animeDetailPage = detailPage;
});

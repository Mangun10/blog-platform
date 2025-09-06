document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_BASE_URL = 'http://localhost:8081/api';
    const ADMIN_PASSWORD = 'test'; // Change this to your password
    
    // DOM Elements
    const loadingDiv = document.getElementById('loading');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    
    // State Management
    let currentState = {
        view: 'home',
        postId: null
    };
    let allPosts = []; // Store all posts for filtering/sorting
    let isAdmin = false; // Track admin status

    // Check admin status (simple implementation)
    const checkAdminStatus = () => {
        const adminKey = localStorage.getItem('blogAdmin');
        isAdmin = adminKey === 'authenticated';
        updateAdminUI();
    };

    const updateAdminUI = () => {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
        
        // Update admin button appearance
        const adminBtn = document.getElementById('adminAccessBtn');
        if (adminBtn) {
            if (isAdmin) {
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                adminBtn.title = 'Admin Mode Active - Click to logout';
                adminBtn.classList.add('admin-active');
            } else {
                adminBtn.innerHTML = '<i class="fas fa-key"></i>';
                adminBtn.title = 'Admin Access';
                adminBtn.classList.remove('admin-active');
            }
        }
    };

    // Prompt for admin access when needed
    const promptAdminAccess = () => {
        if (isAdmin) {
            // If already admin, allow logout
            const logout = confirm("You are currently in admin mode. Do you want to logout?");
            if (logout) {
                localStorage.removeItem('blogAdmin');
                isAdmin = false;
                updateAdminUI();
                showMessage('Logged out from admin mode');
                // If currently on admin-only page, redirect to home
                if (currentState.view === 'create-post' || currentState.view === 'edit-post') {
                    navigateTo('home');
                }
            }
            return isAdmin;
        }
        
        const password = prompt("Enter admin password:");
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('blogAdmin', 'authenticated');
            isAdmin = true;
            updateAdminUI();
            showMessage('Admin access granted!');
            return true;
        } else if (password !== null) { // Only show error if user didn't cancel
            showMessage('Incorrect password');
        }
        return false;
    };

    // Mobile Navigation Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (nav) nav.classList.remove('active');
        });
    });

    // Dark Mode Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            if (newTheme === 'dark') {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        });
    }

    // Utility Functions
    const showMessage = (message, duration = 3000) => {
        if (!message) return; // Don't show empty messages
        messageText.textContent = message;
        messageBox.classList.add('show');
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, duration);
    };

    const showLoading = () => { 
        loadingDiv.style.display = 'flex'; 
    };
    
    const hideLoading = () => { 
        loadingDiv.style.display = 'none'; 
    };

    // --- Fetch API Handlers (using your reference logic) ---

    const fetchPosts = async () => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts`);
            if (!response.ok) throw new Error('Failed to fetch posts');
            allPosts = await response.json();
            allPosts.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
            renderCurrentView();
        } catch (error) {
            console.error('Error fetching posts:', error);
            showMessage('Failed to load posts. Please check your connection.', 5000);
            renderCurrentView(); // Render with empty posts
        } finally {
            hideLoading();
        }
    };

    const fetchPostById = async (id) => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`);
            if (!response.ok) throw new Error('Failed to fetch post');
            const post = await response.json();
            renderPostDetailPage(post);
        } catch (error) {
            console.error('Error fetching post:', error);
            showMessage('Failed to load post.', 5000);
            navigateTo('home');
        } finally {
            hideLoading();
        }
    };

    const fetchCommentsByPostId = async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    };

    const createPost = async (postData) => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            if (!response.ok) throw new Error('Failed to create post');
            const newPost = await response.json();
            showMessage('Post created successfully!');
            allPosts.unshift(newPost);
            navigateTo('post', newPost.id);
        } catch (error) {
            console.error('Error creating post:', error);
            showMessage('Failed to create post.');
        } finally {
            hideLoading();
        }
    };

    const updatePost = async (id, postData) => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            if (!response.ok) throw new Error('Failed to update post');
            const updatedPost = await response.json();
            showMessage('Post updated successfully!');
            const index = allPosts.findIndex(p => p.id == id);
            if (index !== -1) allPosts[index] = updatedPost;
            navigateTo('post', updatedPost.id);
        } catch (error) {
            console.error('Error updating post:', error);
            showMessage('Failed to update post.');
        } finally {
            hideLoading();
        }
    };

    const deletePost = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this post?");
        if (!confirmed) return;
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete post');
            showMessage('Post deleted successfully!');
            allPosts = allPosts.filter(p => p.id != id);
            navigateTo('home');
        } catch (error) {
            console.error('Error deleting post:', error);
            showMessage('Failed to delete post.');
        } finally {
            hideLoading();
        }
    };

    const createComment = async (postId, commentData) => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData)
            });
            if (!response.ok) throw new Error('Failed to add comment');
            showMessage('Comment added!');
            fetchPostById(postId);
        } catch (error) {
            console.error('Error adding comment:', error);
            showMessage('Failed to add comment.');
        } finally {
            hideLoading();
        }
    };
    
    const deleteComment = async (postId, commentId) => {
        const confirmed = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmed) return;
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete comment');
            showMessage('Comment deleted successfully!');
            fetchPostById(postId);
        } catch (error) {
            console.error('Error deleting comment:', error);
            showMessage('Failed to delete comment.');
        } finally {
            hideLoading();
        }
    };

    // --- Render Functions ---

    const renderHomePage = () => {
        const recentPosts = allPosts.slice(0, 3);
        const postsContainer = document.getElementById('recent-posts-container');
        
        if (!postsContainer) return;

        if (recentPosts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <p class="empty-message">No posts yet. Check back soon for updates!</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = `
            <div class="posts-grid">
                ${recentPosts.map(post => `
                    <article class="post-card" data-id="${post.id}">
                        <div class="post-category">Technical Blog</div>
                        <h3>${post.title}</h3>
                        <div class="post-meta">
                            <span>By ${post.author}</span>
                            <span>•</span>
                            <span>${new Date(post.creationDate).toLocaleDateString()}</span>
                        </div>
                        <p class="post-excerpt">
                            ${post.content.substring(0, 150)}...
                        </p>
                    </article>
                `).join('')}
            </div>
        `;

        // Add click listeners to post cards
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.id;
                navigateTo('post', postId);
            });
        });
    };

    const renderAllPostsPage = () => {
        const postsContainer = document.getElementById('all-posts-container');
        const resultsCount = document.getElementById('search-results-count');
        
        if (!postsContainer) return;

        // Get current filter values
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const sortOrder = document.getElementById('sortSelect')?.value || 'recent';
        
        // Filter posts
        let filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.author.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm)
        );

        // Sort posts
        switch (sortOrder) {
            case 'recent':
                filteredPosts.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
                break;
            case 'oldest':
                filteredPosts.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));
                break;
            case 'title':
                filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'author':
                filteredPosts.sort((a, b) => a.author.localeCompare(b.author));
                break;
        }

        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `Showing ${filteredPosts.length} of ${allPosts.length} posts`;
        }

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <p class="empty-message">No posts match your search criteria.</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = `
            <div class="posts-grid">
                ${filteredPosts.map(post => `
                    <article class="post-card" data-id="${post.id}">
                        <div class="post-category">Technical Blog</div>
                        <h3>${post.title}</h3>
                        <div class="post-meta">
                            <span>By ${post.author}</span>
                            <span>•</span>
                            <span>${new Date(post.creationDate).toLocaleDateString()}</span>
                        </div>
                        <p class="post-excerpt">
                            ${post.content.substring(0, 150)}...
                        </p>
                    </article>
                `).join('')}
            </div>
        `;

        // Add click listeners to post cards
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.id;
                navigateTo('post', postId);
            });
        });
    };

    const renderPostDetailPage = async (post) => {
        const comments = await fetchCommentsByPostId(post.id);
        const formattedDate = new Date(post.creationDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const postContent = document.getElementById('post-content');
        const commentsList = document.getElementById('comments-list');

        if (postContent) {
            postContent.innerHTML = `
                <div class="article-header">
                    <h1 class="article-title">${post.title}</h1>
                    <div class="article-meta">
                        <div class="article-info">
                            <span>By ${post.author}</span>
                            <span>•</span>
                            <span>${formattedDate}</span>
                        </div>
                        ${isAdmin ? `
                        <div class="article-actions">
                            <button class="btn btn-secondary" onclick="navigateTo('edit-post', ${post.id})">Edit</button>
                            <button class="btn btn-secondary" onclick="deletePost(${post.id})">Delete</button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="article-content">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            `;
        }

        if (commentsList) {
            commentsList.innerHTML = `
                ${comments.length > 0 ? comments.map(comment => `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${comment.author}</span>
                            ${isAdmin ? `
                            <button class="comment-delete" onclick="deleteComment(${post.id}, ${comment.id})">
                                Delete
                            </button>
                            ` : ''}
                        </div>
                        <p class="comment-content">${comment.content}</p>
                    </div>
                `).join('') : '<p class="empty-message">No comments yet. Be the first to comment!</p>'}
            `;
        }
    };

    const renderCreateEditPage = (post = null) => {
        const isEdit = post !== null;
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        
        if (formTitle) {
            formTitle.textContent = isEdit ? 'Edit Post' : 'Create New Post';
        }
        
        if (submitBtn) {
            submitBtn.textContent = isEdit ? 'Update Post' : 'Publish Post';
        }
        
        if (deleteBtn) {
            if (isEdit) {
                deleteBtn.classList.remove('view-hidden');
                deleteBtn.onclick = () => deletePost(post.id);
            } else {
                deleteBtn.classList.add('view-hidden');
            }
        }

        if (isEdit && post) {
            document.getElementById('postTitle').value = post.title;
            document.getElementById('postAuthor').value = post.author;
            document.getElementById('postContent').value = post.content;
        } else {
            document.getElementById('postTitle').value = '';
            document.getElementById('postAuthor').value = 'Manas Gunti';
            document.getElementById('postContent').value = '';
        }
    };

    const renderCurrentView = () => {
        switch (currentState.view) {
            case 'home':
                renderHomePage();
                break;
            case 'all-posts':
                renderAllPostsPage();
                break;
            case 'post':
                // Post detail is handled by fetchPostById
                break;
            case 'contact':
                // Contact page is static
                break;
            case 'create-post':
            case 'edit-post':
                // Form pages are handled separately
                break;
        }
    };

    // Navigation Functions
    const navigateTo = (view, id = null) => {
        // Check admin access for create/edit
        if ((view === 'create-post' || view === 'edit-post') && !isAdmin) {
            if (!promptAdminAccess()) {
                return;
            }
        }

        currentState.view = view;
        currentState.postId = id;
        window.history.pushState(currentState, '', `#${view}${id ? '/' + id : ''}`);
        renderApp();
    };

    // Make functions globally available
    window.navigateTo = navigateTo;
    window.deletePost = deletePost;
    window.deleteComment = deleteComment;

    const renderApp = () => {
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.add('view-hidden'));
        
        switch (currentState.view) {
            case 'home':
                document.getElementById('homeView').classList.remove('view-hidden');
                if (allPosts.length === 0) {
                    fetchPosts();
                } else {
                    renderHomePage();
                }
                break;
            case 'all-posts':
                document.getElementById('allPostsView').classList.remove('view-hidden');
                if (allPosts.length === 0) {
                    fetchPosts();
                } else {
                    renderAllPostsPage();
                }
                break;
            case 'contact':
                document.getElementById('contactView').classList.remove('view-hidden');
                break;
            case 'post':
                if (currentState.postId) {
                    document.getElementById('postDetailView').classList.remove('view-hidden');
                    fetchPostById(currentState.postId);
                } else {
                    navigateTo('home');
                }
                break;
            case 'create-post':
            case 'create': // Handle both routes
                document.getElementById('createEditView').classList.remove('view-hidden');
                renderCreateEditPage();
                break;
            case 'edit-post':
                if (currentState.postId) {
                    document.getElementById('createEditView').classList.remove('view-hidden');
                    const post = allPosts.find(p => p.id == currentState.postId);
                    if (post) {
                        renderCreateEditPage(post);
                    } else {
                        fetch(`${API_BASE_URL}/posts/${currentState.postId}`)
                            .then(response => response.json())
                            .then(post => renderCreateEditPage(post))
                            .catch(error => {
                                console.error('Error fetching post for edit:', error);
                                showMessage('Failed to load post for editing.');
                                navigateTo('home');
                            });
                    }
                } else {
                    navigateTo('home');
                }
                break;
            default:
                navigateTo('home');
        }
    };

    // Event Listeners
    
    // Logo click to home
    document.getElementById('logoLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('home');
    });

    // Admin access button
    document.getElementById('adminAccessBtn')?.addEventListener('click', promptAdminAccess);

    // Home page buttons
    document.getElementById('viewAllPostsBtn')?.addEventListener('click', () => navigateTo('all-posts'));
    document.getElementById('contactBtn')?.addEventListener('click', () => navigateTo('contact'));

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href').substring(1);
            navigateTo(href);
        });
    });

    // Back buttons
    document.getElementById('backToHomeFromAll')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('backToHomeFromContact')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('backToPostsBtn')?.addEventListener('click', () => navigateTo('all-posts'));
    document.getElementById('backFromCreateBtn')?.addEventListener('click', () => {
        if (currentState.view === 'edit-post' && currentState.postId) {
            navigateTo('post', currentState.postId);
        } else {
            navigateTo('home');
        }
    });

    // Search and filter for all posts page
    const setupSearchAndFilter = () => {
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (currentState.view === 'all-posts') {
                    renderAllPostsPage();
                }
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                if (currentState.view === 'all-posts') {
                    renderAllPostsPage();
                }
            });
        }
    };

    // Forms
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const postData = {
                title: form.title.value,
                author: form.author.value,
                content: form.content.value
            };
            if (currentState.view === 'edit-post' && currentState.postId) {
                updatePost(currentState.postId, postData);
            } else {
                createPost(postData);
            }
        });
    }

    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const commentData = {
                author: form.elements.commentAuthor.value,
                content: form.elements.commentContent.value
            };
            createComment(currentState.postId, commentData);
            form.reset();
        });
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            currentState = event.state;
            renderApp();
        }
    });

    // Initialize
    checkAdminStatus();
    setupSearchAndFilter();

    // Initial render based on URL hash
    window.onload = () => {
        const path = window.location.hash.slice(1);
        if (path) {
            const [view, id] = path.split('/');
            currentState = { view, postId: id };
        }
        renderApp();
    };
});
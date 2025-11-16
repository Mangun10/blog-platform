document.addEventListener('DOMContentLoaded', function() {
    // API Configuration - Dynamic URL for production
    const API_BASE_URL = window.location.origin + '/api';
    const ADMIN_PASSWORD = 'test'; // This will be overridden by environment variable
    
    // DOM Elements gvgfg
    const loadingDiv = document.getElementById('loading');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    
    // State Management
    let currentState = {
        view: 'home',
        postId: null
    };
    let allPosts = []; // Store all posts for filtering/sorting
    let allCategories = []; // Store all categories for filtering
    let isAdmin = false; // Track admin status
    let quill = null; // Rich text editor instance

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
            await fetchCategories(); // Fetch categories after posts
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

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            allCategories = await response.json();
            populateCategoryFilter();
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const populateCategoryFilter = () => {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            allCategories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
            });
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
                ${recentPosts.map(post => renderPostCard(post)).join('')}
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
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        
        // Filter posts
        let filteredPosts = allPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchTerm) ||
                                post.author.toLowerCase().includes(searchTerm) ||
                                post.content.toLowerCase().includes(searchTerm) ||
                                (post.category && post.category.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || post.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });

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
            case 'category':
                filteredPosts.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
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
                ${filteredPosts.map(post => renderPostCard(post)).join('')}
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
        
        // Format date properly, handling the field name from your database
        const dateValue = post.creation_date || post.creationDate;
        const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : '';
        
        // Check if post is already liked
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        const isLiked = likedPosts.includes(post.id);

        const postContent = document.getElementById('post-content');
        const commentsList = document.getElementById('comments-list');

        if (postContent) {
            postContent.innerHTML = `
                <div class="article-header">
                    <h1 class="article-title">${post.title}</h1>
                    <div class="article-meta">
                        <div class="article-info">
                            <span>By ${post.author}</span>
                            ${formattedDate ? `<span>•</span><span>${formattedDate}</span>` : ''}
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
                    ${post.content}
                </div>
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); likePost(${post.id})">
                        <i class="fas fa-heart"></i> ${post.likes || 0}
                    </button>
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

        // Initialize or reinitialize the editor
        setTimeout(() => {
            initializeEditor();
            setupFileUpload();
            
            if (isEdit && post) {
                document.getElementById('postTitle').value = post.title;
                document.getElementById('postAuthor').value = post.author;
                document.getElementById('featuredImage').value = post.featuredImage || '';
                document.getElementById('excerpt').value = post.excerpt || '';
                
                const categorySelect = document.getElementById('postCategory');
                const customCategoryInput = document.getElementById('customCategory');
                
                if (post.category) {
                    const predefinedCategories = ['Technical', 'Philosophy', 'Life'];
                    if (predefinedCategories.includes(post.category)) {
                        categorySelect.value = post.category;
                        customCategoryInput.style.display = 'none';
                    } else {
                        categorySelect.value = 'custom';
                        customCategoryInput.style.display = 'block';
                        customCategoryInput.value = post.category;
                    }
                }
                
                // Set editor content - handle both HTML and plain text
                if (quill && post.content) {
                    // Check if content is HTML or plain text
                    if (post.content.includes('<') && post.content.includes('>')) {
                        // It's HTML content
                        quill.root.innerHTML = post.content;
                    } else {
                        // It's plain text, convert newlines to HTML
                        const htmlContent = post.content.replace(/\n/g, '<br>');
                        quill.root.innerHTML = htmlContent;
                    }
                    document.getElementById('postContent').value = quill.root.innerHTML;
                }
            } else {
                // Clear form for new post
                document.getElementById('postTitle').value = '';
                document.getElementById('postAuthor').value = 'Manas Gunti';
                document.getElementById('featuredImage').value = '';
                document.getElementById('excerpt').value = '';
                document.getElementById('postCategory').value = '';
                document.getElementById('customCategory').style.display = 'none';
                document.getElementById('customCategory').value = '';
                
                if (quill) {
                    quill.setContents([]);
                    document.getElementById('postContent').value = '';
                }
            }
        }, 100);
    };

    // Add category selection handling
    const setupCategoryHandling = () => {
        const categorySelect = document.getElementById('postCategory');
        const customCategoryInput = document.getElementById('customCategory');
        
        if (categorySelect && customCategoryInput) {
            categorySelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customCategoryInput.style.display = 'block';
                    customCategoryInput.required = true;
                } else {
                    customCategoryInput.style.display = 'none';
                    customCategoryInput.required = false;
                    customCategoryInput.value = '';
                }
            });
        }
    };

    // Initialize rich text editor
    const initializeEditor = () => {
        // Destroy existing editor if it exists
        if (quill) {
            const toolbar = document.querySelector('.ql-toolbar');
            const container = document.querySelector('.ql-container');
            if (toolbar) toolbar.remove();
            if (container) container.remove();
            quill = null;
        }
        
        // Make sure editor element exists
        const editorElement = document.getElementById('editor');
        if (!editorElement) return;
        
        // Clear any existing content
        editorElement.innerHTML = '';
        
        quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        // Handle content changes
        quill.on('text-change', () => {
            const content = quill.root.innerHTML;
            const hiddenTextarea = document.getElementById('postContent');
            if (hiddenTextarea) {
                hiddenTextarea.value = content;
            }
        });
    };

    // File upload functionality
    const setupFileUpload = () => {
        const fileInput = document.getElementById('fileInput');
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        const uploadVideoBtn = document.getElementById('uploadVideoBtn');

        uploadImageBtn?.addEventListener('click', () => {
            fileInput.accept = 'image/*';
            fileInput.click();
        });

        uploadVideoBtn?.addEventListener('click', () => {
            fileInput.accept = 'video/*';
            fileInput.click();
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadFile(file);
            }
        });
    };

    // Upload file function
    const uploadFile = async (file) => {
        if (!file) return;

        showLoading();
        
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/files/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            insertMediaIntoEditor(result);
            showMessage('File uploaded successfully!');

        } catch (error) {
            console.error('Upload error:', error);
            showMessage(`Upload failed: ${error.message}`);
        } finally {
            hideLoading();
            // Reset file input
            document.getElementById('fileInput').value = '';
        }
    };

    // Insert media into editor
    const insertMediaIntoEditor = (fileData) => {
        if (!quill) return;

        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();

        if (fileData.type.startsWith('image/')) {
            quill.insertEmbed(index, 'image', fileData.url);
            quill.insertText(index + 1, '\n');
            quill.setSelection(index + 2);
            
            // Make images resizable and properly styled
            setTimeout(() => {
                const images = quill.container.querySelectorAll('img');
                images.forEach(img => {
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.margin = '10px 0';
                    img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    img.style.cursor = 'pointer';
                    
                    // Add click handler for image resizing
                    img.addEventListener('click', () => {
                        const currentWidth = img.style.width;
                        if (currentWidth === '50%') {
                            img.style.width = '100%';
                        } else if (currentWidth === '100%' || !currentWidth) {
                            img.style.width = '75%';
                        } else if (currentWidth === '75%') {
                            img.style.width = '50%';
                        }
                    });
                });
            }, 100);
            
        } else if (fileData.type.startsWith('video/')) {
            // Insert video as HTML
            const videoHtml = `<video controls style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;">
                <source src="${fileData.url}" type="${fileData.type}">
                Your browser does not support the video tag.
            </video>`;
            
            quill.clipboard.dangerouslyPasteHTML(index, videoHtml);
            quill.setSelection(index + 1);
        }
    };

    // Update post card rendering to show featured images
    const renderPostCard = (post) => {
        const featuredImageHtml = (post.featured_image && post.featured_image.trim()) ? 
            `<img src="${post.featured_image}" alt="${post.title}" class="post-card-image">` : '';
        
        // Create excerpt from content if none exists
        let excerpt = '';
        if (post.excerpt && post.excerpt.trim()) {
            excerpt = post.excerpt.trim();
        } else if (post.content && post.content.trim()) {
            // Remove HTML tags and get clean text, handle multiple spaces
            const cleanContent = post.content
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&nbsp;/g, ' ') // Replace HTML spaces
                .replace(/&amp;/g, '&') // Replace HTML entities
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim(); // Remove leading/trailing spaces
            
            if (cleanContent.length > 0) {
                excerpt = cleanContent.length > 120 ? cleanContent.substring(0, 120) + '...' : cleanContent;
            }
        }
        
        // Fallback if excerpt is still empty or too short
        if (!excerpt || excerpt.trim() === '' || excerpt.trim().length < 10) {
            excerpt = `A ${post.category || 'blog'} post by ${post.author}. Click to read more...`;
        }
        
        // Format date properly
        const dateValue = post.creation_date || post.creationDate;
        const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString() : '';
        
        // Check if post is already liked
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        const isLiked = likedPosts.includes(post.id);

        return `
            <article class="post-card ${(post.featured_image && post.featured_image.trim()) ? 'has-image' : ''}" data-id="${post.id}">
                ${featuredImageHtml}
                <div class="post-card-content">
                    <div class="post-category">${post.category || 'Uncategorized'}</div>
                    <h3>${post.title}</h3>
                    ${formattedDate ? `<div class="post-meta"><span>${formattedDate}</span></div>` : ''}
                    <p class="post-excerpt">${excerpt}</p>
                    <div class="post-actions">
                        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); likePost(${post.id})" title="Like this post">
                            <i class="fas fa-heart"></i> ${post.likes || 0}
                        </button>
                    </div>
                </div>
            </article>
        `;
    };

    // --- Render Functions ---

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
        const categoryFilter = document.getElementById('categoryFilter');
        
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
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
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
            
            let category = form.category.value;
            if (category === 'custom') {
                category = form.customCategory.value.trim();
                if (!category) {
                    showMessage('Please enter a custom category name.');
                    return;
                }
            }
            
            // Get content from Quill editor
            const content = quill ? quill.root.innerHTML : form.content.value;
            
            const postData = {
                title: form.title.value,
                author: form.author.value,
                content: content,
                category: category,
                featuredImage: form.featuredImage.value || null,
                excerpt: form.excerpt.value || null
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
    setupCategoryHandling();

    // Initial render based on URL hash
    window.onload = () => {
        const path = window.location.hash.slice(1);
        if (path) {
            const [view, id] = path.split('/');
            currentState = { view, postId: id };
        }
        renderApp();
    };

    // Social media functions
    window.likePost = async function(postId) {
        // Check if already liked
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        if (likedPosts.includes(postId)) {
            showMessage('You already liked this post!');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Update the like count in UI without full reload
                const post = await response.json();
                
                // Store liked post
                likedPosts.push(postId);
                localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                
                // Update all like buttons for this post
                document.querySelectorAll(`.like-btn[onclick*="${postId}"]`).forEach(btn => {
                    const textNode = Array.from(btn.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        textNode.textContent = ` ${post.likes || 0}`;
                    }
                    btn.classList.add('liked');
                });
                
                // Also update in allPosts array
                const postIndex = allPosts.findIndex(p => p.id == postId);
                if (postIndex !== -1) {
                    allPosts[postIndex].likes = post.likes;
                }
                
                showMessage('Post liked!');
            } else {
                console.error('Failed to like post');
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    window.openShareModal = function(postId, postTitle, postSummary) {
        const modal = document.getElementById('shareModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalSummary = modal.querySelector('.modal-summary');
        
        modalTitle.textContent = postTitle;
        modalSummary.textContent = postSummary;
        
        // Set up share buttons
        const twitterBtn = modal.querySelector('.twitter-share');
        const facebookBtn = modal.querySelector('.facebook-share');
        const linkedinBtn = modal.querySelector('.linkedin-share');
        const copyBtn = modal.querySelector('.copy-link');
        
        const postUrl = `${window.location.origin}/post/${postId}`;
        
        twitterBtn.onclick = () => shareOnTwitter(postTitle, postUrl);
        facebookBtn.onclick = () => shareOnFacebook(postUrl);
        linkedinBtn.onclick = () => shareOnLinkedIn(postTitle, postSummary, postUrl);
        copyBtn.onclick = () => copyToClipboard(postUrl);
        
        modal.style.display = 'block';
    };

    window.shareOnTwitter = function(title, url) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        incrementShareCount();
    };

    window.shareOnFacebook = function(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        incrementShareCount();
    };

    window.shareOnLinkedIn = function(title, summary, url) {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
        incrementShareCount();
    };

    window.copyToClipboard = async function(url) {
        try {
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
            incrementShareCount();
        } catch (error) {
            console.error('Failed to copy link:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Link copied to clipboard!');
            incrementShareCount();
        }
    };

    window.incrementShareCount = async function() {
        if (currentState.view === 'singlePost' && currentState.postId) {
            try {
                const response = await fetch(`/api/posts/${currentState.postId}/share`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    // Update the share count in the current view
                    await loadPosts();
                    renderApp();
                }
            } catch (error) {
                console.error('Error updating share count:', error);
            }
        }
        
        // Close the modal
        document.getElementById('shareModal').style.display = 'none';
    };

    window.openEmailSubscriptionModal = function() {
        document.getElementById('emailSubscriptionModal').style.display = 'block';
    };

    window.openEmailPostModal = function(postId, postTitle) {
        const modal = document.getElementById('emailPostModal');
        const modalTitle = modal.querySelector('.modal-title');
        const postIdInput = document.getElementById('emailPostId');
        
        modalTitle.textContent = `Send "${postTitle}" via Email`;
        postIdInput.value = postId;
        
        modal.style.display = 'block';
    };

    // Modal close handlers
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Email subscription form handler
    document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('subscribeEmail').value;
        
        try {
            const response = await fetch('/api/subscribers/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            
            if (response.ok) {
                alert('Successfully subscribed to the newsletter!');
                document.getElementById('emailSubscriptionModal').style.display = 'none';
                document.getElementById('subscribeForm').reset();
            } else {
                const error = await response.text();
                alert(`Subscription failed: ${error}`);
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            alert('An error occurred while subscribing. Please try again.');
        }
    });

    // Email post form handler  
    document.getElementById('emailPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('emailAddress').value;
        const postId = document.getElementById('emailPostId').value;
        
        try {
            const response = await fetch('/api/subscribers/send-post-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email,
                    postId: parseInt(postId)
                })
            });
            
            if (response.ok) {
                alert('Post sent successfully via email!');
                document.getElementById('emailPostModal').style.display = 'none';
                document.getElementById('emailPostForm').reset();
            } else {
                const error = await response.text();
                alert(`Failed to send email: ${error}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('An error occurred while sending the email. Please try again.');
        }
    });
});
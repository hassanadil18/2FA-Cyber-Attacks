/**
 * zeroseo WEBSITE - MAIN JAVASCRIPT FILE
 * ================================================
 * Handles dynamic blog rendering, interactions, and form validation
 * ================================================
 */

// ================================================
// BLOG LIST PAGE - Render Blog Cards
// ================================================
function renderBlogList() {
    const blogGrid = document.getElementById('blogGrid');
    
    if (!blogGrid) return; // Exit if not on blog list page
    
    // Clear existing content
    blogGrid.innerHTML = '';
    
    // Sort posts by date (newest first)
    const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create HTML for each blog post
    sortedPosts.forEach((post) => {
        const postDate = new Date(post.date);
        const formattedDate = postDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const blogCard = document.createElement('div');
        blogCard.className = 'col-md-6 col-lg-4';
        blogCard.innerHTML = `
            <article class="blog-card blog-card-link" role="link" tabindex="0" data-href="blog-single.html?post=${post.id}" aria-label="Read ${post.title}">
                <div class="blog-featured-image">
                    <img src="${post.image}" alt="${post.title}" loading="lazy">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                        <span><i class="fas fa-user"></i> ${post.author}</span>
                    </div>
                    <h3>${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="blog-single.html?post=${post.id}" class="text-decoration-none fw-semibold">
                        Read More →
                    </a>
                </div>
            </article>
        `;
        
        blogGrid.appendChild(blogCard);
    });

    // Make entire blog card clickable while preserving inner link behavior
    blogGrid.querySelectorAll('.blog-card-link').forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('a')) return;
            const href = card.getAttribute('data-href');
            if (href) window.location.href = href;
        });

        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (event.target.closest('a')) return;
            event.preventDefault();
            const href = card.getAttribute('data-href');
            if (href) window.location.href = href;
        });
    });
}

// ================================================
// BLOG SINGLE PAGE - Render Full Blog Post
// ================================================
function renderBlogPost() {
    // Get post ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('post')) || 1;
    
    // Find the post
    const post = blogPosts.find(p => p.id === postId);
    
    if (!post) {
        console.error('Post not found');
        return;
    }
    
    // Format date
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update page meta tags
    document.title = `${post.title} - zeroseo Blog`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', post.excerpt);
    }
    
    // Update breadcrumb
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = post.title;
    }
    
    // Update featured image
    const featuredImg = document.getElementById('featuredImg');
    if (featuredImg) {
        featuredImg.src = post.image;
        featuredImg.alt = post.title;
    }
    
    // Update post date
    const postDateEl = document.getElementById('postDate');
    if (postDateEl) {
        postDateEl.textContent = formattedDate;
    }
    
    // Update post author
    const postAuthorEl = document.getElementById('postAuthor');
    if (postAuthorEl) {
        postAuthorEl.textContent = post.author;
    }
    
    // Update post title
    const postTitleEl = document.getElementById('postTitle');
    if (postTitleEl) {
        postTitleEl.textContent = post.title;
    }
    
    // Update post content
    const postContentEl = document.getElementById('postContent');
    if (postContentEl) {
        postContentEl.innerHTML = post.content;
    }
    
    // Update navigation links
    const currentIndex = blogPosts.findIndex(p => p.id === postId);
    
    // Previous post
    const prevPostEl = document.getElementById('prevPost');
    if (currentIndex > 0) {
        const prevPost = blogPosts[currentIndex - 1];
        prevPostEl.href = `blog-single.html?post=${prevPost.id}`;
        document.getElementById('prevLabel').textContent = prevPost.title;
    } else {
        prevPostEl.style.opacity = '0.5';
        prevPostEl.style.pointerEvents = 'none';
        document.getElementById('prevLabel').textContent = 'No Previous Post';
    }
    
    // Next post
    const nextPostEl = document.getElementById('nextPost');
    if (currentIndex < blogPosts.length - 1) {
        const nextPost = blogPosts[currentIndex + 1];
        nextPostEl.href = `blog-single.html?post=${nextPost.id}`;
        document.getElementById('nextLabel').textContent = nextPost.title;
    } else {
        nextPostEl.style.opacity = '0.5';
        nextPostEl.style.pointerEvents = 'none';
        document.getElementById('nextLabel').textContent = 'No Next Post';
    }
    
    // Related posts (show 3 random posts, excluding current)
    const relatedPostsContainer = document.getElementById('relatedPosts');
    if (relatedPostsContainer) {
        const otherPosts = blogPosts.filter(p => p.id !== postId);
        const randomPosts = otherPosts.sort(() => Math.random() - 0.5).slice(0, 3);
        
        relatedPostsContainer.innerHTML = '';
        randomPosts.forEach((relatedPost) => {
            const relatedCard = document.createElement('div');
            relatedCard.className = 'related-post-card';
            relatedCard.innerHTML = `
                <div class="related-post-image">
                    <img src="${relatedPost.image}" alt="${relatedPost.title}" loading="lazy">
                </div>
                <div class="related-post-content">
                    <h6 class="mb-2">${relatedPost.title}</h6>
                    <a href="blog-single.html?post=${relatedPost.id}" class="text-decoration-none">
                        Read Post →
                    </a>
                </div>
            `;
            relatedPostsContainer.appendChild(relatedCard);
        });
    }
    
    // Recent posts (show last 5)
    const recentPostsContainer = document.getElementById('recentPosts');
    if (recentPostsContainer) {
        const recentPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        recentPostsContainer.innerHTML = '';
        recentPosts.forEach((recentPost) => {
            const listItem = document.createElement('li');
            listItem.className = 'mb-3 pb-3 border-bottom';
            
            const postDateStr = new Date(recentPost.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            listItem.innerHTML = `
                <a href="blog-single.html?post=${recentPost.id}" class="text-decoration-none d-block mb-1">
                    ${recentPost.title}
                </a>
                <small class="text-muted">${postDateStr}</small>
            `;
            recentPostsContainer.appendChild(listItem);
        });
    }
}

// ================================================
// SMOOTH SCROLLING
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ================================================
// FORM VALIDATION & SUBMISSION
// ================================================
function validateContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');
    const subject = form.querySelector('#subject');
    const agreeTerms = form.querySelector('#agreeTerms');
    
    // Validate name
    if (name && name.value.trim() === '') {
        name.classList.add('is-invalid');
        return false;
    } else if (name) {
        name.classList.remove('is-invalid');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email.value)) {
        email.classList.add('is-invalid');
        return false;
    } else if (email) {
        email.classList.remove('is-invalid');
    }
    
    // Validate subject
    if (subject && subject.value === '') {
        subject.classList.add('is-invalid');
        return false;
    } else if (subject) {
        subject.classList.remove('is-invalid');
    }
    
    // Validate message
    if (message && message.value.trim().length < 10) {
        message.classList.add('is-invalid');
        return false;
    } else if (message) {
        message.classList.remove('is-invalid');
    }
    
    // Validate checkbox
    if (agreeTerms && !agreeTerms.checked) {
        agreeTerms.classList.add('is-invalid');
        return false;
    } else if (agreeTerms) {
        agreeTerms.classList.remove('is-invalid');
    }
    
    return true;
}

// ================================================
// EMAIL JS INITIALIZATION & FORM SUBMISSION
// ================================================

const EMAILJS_CONFIG = {
    publicKey: 'ZmHWrknXIJ28Mt4DK',
    serviceId: 'service_c1rfvuj',
    templateId: 'template_7yfmbg9',
    recipientEmail: 'zero.seo.zs.10@gmail.com'
};

let emailJsReady = false;

function getEmailJsClient() {
    if (window.emailjs) return window.emailjs;
    if (typeof emailjs !== 'undefined') return emailjs;
    return null;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function ensureEmailJsLoaded() {
    if (getEmailJsClient()) return true;

    const fallbackSources = [
        'https://unpkg.com/@emailjs/browser@4/dist/email.min.js',
        'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    ];

    for (const src of fallbackSources) {
        try {
            await loadScript(src);
            if (getEmailJsClient()) return true;
        } catch (error) {
            console.warn(error.message);
        }
    }

    return false;
}

async function initEmailJs() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return false;

    await ensureEmailJsLoaded();

    const emailJsClient = getEmailJsClient();
    if (!emailJsClient) {
        console.error('EmailJS library not loaded.');
        return false;
    }

    try {
        emailJsClient.init(EMAILJS_CONFIG.publicKey);
        emailJsReady = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize EmailJS:', error);
        return false;
    }
}

function getSubjectLabel(rawValue) {
    const subjectMap = {
        'software-development': 'Software Development',
        'guest-posting': 'Guest Posting Services',
        'blog-marketing': 'Blog Marketing',
        'general-inquiry': 'General Inquiry',
        partnership: 'Partnership',
        other: 'Other'
    };

    return subjectMap[rawValue] || rawValue || 'General Inquiry';
}

function initContactFormHandler() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        handleFormSubmit(event);
    });
}

function showContactFormError(message) {
    const successMessage = document.getElementById('successMessage');
    if (!successMessage) {
        alert(message);
        return;
    }

    successMessage.classList.remove('alert-success');
    successMessage.classList.add('alert-danger', 'show');
    successMessage.style.display = 'block';
    successMessage.innerHTML = `<strong>Error:</strong> ${message}`;
}

function showContactFormSuccess() {
    const successMessage = document.getElementById('successMessage');
    if (!successMessage) return;

    successMessage.classList.remove('alert-danger');
    successMessage.classList.add('alert-success', 'show');
    successMessage.style.display = 'block';
    successMessage.innerHTML = "<strong>Thank you!</strong> Your message has been sent successfully. We'll get back to you soon.";
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateContactForm()) {
        return;
    }
    
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const successMessage = document.getElementById('successMessage');
    const originalText = submitBtn.textContent;

    if (!emailJsReady) {
        await initEmailJs();
    }

    const emailJsClient = getEmailJsClient();
    if (!emailJsReady || !emailJsClient) {
        showContactFormError('Email service is not ready. Please check internet connection/ad-blocker and try again.');
        return;
    }
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Prepare email data
        const subjectRaw = form.querySelector('#subject').value;
        const subjectLabel = getSubjectLabel(subjectRaw);
        const userEmail = form.querySelector('#email').value.trim();
        const userName = form.querySelector('#name').value.trim();
        const userMessage = form.querySelector('#message').value.trim();
        const userPhone = (form.querySelector('#phone').value || '').trim() || 'Not provided';
        const submittedAt = new Date().toLocaleString();
        const fullMessageText = [
            `Name: ${userName}`,
            `Email: ${userEmail}`,
            `Phone: ${userPhone}`,
            `Subject: ${subjectLabel}`,
            `Submitted At: ${submittedAt}`,
            '',
            'Message:',
            userMessage
        ].join('\n');

        // Keep sender address trusted for providers that reject arbitrary "from" values.
        // The visitor's email is preserved in reply_to/user_email for direct replies.
        const formData = {
            from_name: userName,
            from_email: EMAILJS_CONFIG.recipientEmail,
            reply_to: userEmail,
            user_name: userName,
            user_email: userEmail,
            name: userName,
            email: userEmail,
            sender_email: userEmail,
            phone: userPhone,
            mobile: userPhone,
            subject: subjectLabel,
            subject_line: `Contact Form: ${subjectLabel}`,
            subject_label: subjectLabel,
            subject_value: subjectRaw,
            message: fullMessageText,
            user_message: userMessage,
            message_html: fullMessageText.replace(/\n/g, '<br>'),
            inquiry_type: subjectLabel,
            source: 'Website Contact Form',
            to_email: EMAILJS_CONFIG.recipientEmail,
            to_name: 'zeroseo',
            submitted_at: submittedAt
        };
        
        // Send email using EmailJS
        const response = await emailJsClient.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            formData
        );
        
        if (response.status === 200) {
            // Show success message
            showContactFormSuccess();
            form.reset();
            
            // Remove validation classes
            form.querySelectorAll('.form-control, .form-select').forEach(field => {
                field.classList.remove('is-invalid');
            });
            
            // Hide success message after 6 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 6000);
        }
    } catch (error) {
        const errorStatus = error?.status || 'unknown';
        const errorText = error?.text || error?.message || 'Unknown EmailJS error';
        console.error('Error sending email:', error);
        showContactFormError(`Error sending message (${errorStatus}): ${errorText}`);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ================================================
// ACTIVE NAVBAR LINK
// ================================================
function setActiveNavLink() {
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        // Get the path from the href
        const href = link.getAttribute('href');
        if (href && currentLocation.includes(href.split('/').pop())) {
            link.classList.add('active');
        }
    });
}

// ================================================
// SCROLL-TO-TOP BUTTON
// ================================================
function initScrollToTop() {
    const scrollBtn = document.createElement('div');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #0d6efd;
        color: white;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        font-size: 1.25rem;
    `;
    
    document.body.appendChild(scrollBtn);
    
    // Show button when scrolling down
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effects
    scrollBtn.addEventListener('mouseover', () => {
        scrollBtn.style.background = '#0b5ed7';
        scrollBtn.style.transform = 'translateY(-3px)';
    });
    
    scrollBtn.addEventListener('mouseout', () => {
        scrollBtn.style.background = '#0d6efd';
        scrollBtn.style.transform = 'translateY(0)';
    });
}

// ================================================
// LAZY LOADING IMAGES
// ================================================
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src;
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// ================================================
// ANIMATION ON SCROLL
// ================================================
function initAOS() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    document.querySelectorAll('.service-card, .blog-card, .testimonial-card, .benefit-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// ================================================
// NAVBAR COLLAPSE ON LINK CLICK
// ================================================
function initNavbarCollapseOnClick() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                    toggle: false
                });
                bsCollapse.hide();
            }
        });
    });
}

// ================================================
// COUNTER ANIMATION
// ================================================
function animateCounter(element, target, duration = 2000) {
    const increment = target / (duration / 16);
    let current = 0;
    
    const update = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    };
    
    update();
}

// ================================================
// INITIALIZE ALL FEATURES ON PAGE LOAD
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS only when contact form exists
    initEmailJs();
    initContactFormHandler();

    // Set active nav link
    setActiveNavLink();
    
    // Initialize scroll to top button
    initScrollToTop();
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Initialize animations on scroll
    initAOS();
    
    // Initialize navbar collapse on link click
    initNavbarCollapseOnClick();
    
    // Log that scripts are loaded
    console.log('zeroseo website scripts initialized successfully');
});

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Format date in readable format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get URL parameter value
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value or null
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, length = 150) {
    if (text.length > length) {
        return text.substring(0, length) + '...';
    }
    return text;
}

/**
 * Debounce function for optimizing event handlers
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ================================================
// EXPORT FOR MODULE USAGE IF NEEDED
// ================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderBlogList,
        renderBlogPost,
        formatDate,
        getUrlParam,
        truncateText,
        debounce
    };
}

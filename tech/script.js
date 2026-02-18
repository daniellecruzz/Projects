/**
 * NEXUS TECH - Main JavaScript
 * Enhanced with performance optimizations and modern practices
 */

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Debounce function to limit event handler execution
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function for scroll events
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ==========================================
// NAVBAR FUNCTIONALITY
// ==========================================

/**
 * Add scroll shadow effect to navbar
 */
const handleNavbarScroll = throttle(() => {
    const navbar = document.querySelector('.navbar-custom');
    if (!navbar) return;
    
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = 'none';
    }
}, 100);

/**
 * Update active navigation link based on scroll position
 */
const updateActiveNavLink = throttle(() => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link-custom');
    
    let current = '';
    const scrollY = window.scrollY;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}, 100);

/**
 * Close navbar on mobile after clicking a link
 */
const closeNavbarOnMobile = () => {
    const navbarMenu = document.getElementById('navMenu');
    const navbarToggler = document.getElementById('navToggler');
    
    if (window.innerWidth < 992 && navbarMenu && navbarMenu.classList.contains('active')) {
        navbarMenu.classList.remove('active');
        navbarToggler.classList.remove('active');
        navbarToggler.setAttribute('aria-expanded', 'false');
    }
};

/**
 * Initialize mobile menu toggle
 */
const initMobileMenu = () => {
    const navbarToggler = document.getElementById('navToggler');
    const navbarMenu = document.getElementById('navMenu');
    
    if (!navbarToggler || !navbarMenu) return;
    
    navbarToggler.addEventListener('click', () => {
        const isExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
        
        navbarMenu.classList.toggle('active');
        navbarToggler.classList.toggle('active');
        navbarToggler.setAttribute('aria-expanded', !isExpanded);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbarToggler.contains(e.target) && !navbarMenu.contains(e.target)) {
            navbarMenu.classList.remove('active');
            navbarToggler.classList.remove('active');
            navbarToggler.setAttribute('aria-expanded', 'false');
        }
    });
};

// ==========================================
// SMOOTH SCROLL
// ==========================================

/**
 * Initialize smooth scroll for anchor links
 */
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just '#'
            if (href === '#') return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (!target) return;
            
            const offsetTop = target.offsetTop - 80;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile navbar
            closeNavbarOnMobile();
            
            // Update URL without scrolling
            if (history.pushState) {
                history.pushState(null, null, href);
            }
        });
    });
};

// ==========================================
// FORM VALIDATION & SUBMISSION
// ==========================================

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Show validation error
 */
const showError = (input, message) => {
    input.classList.add('is-invalid');
    const feedback = input.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
};

/**
 * Clear validation error
 */
const clearError = (input) => {
    input.classList.remove('is-invalid');
};

/**
 * Validate form field
 */
const validateField = (field) => {
    const value = field.value.trim();
    
    clearError(field);
    
    if (!value) {
        showError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && !isValidEmail(value)) {
        showError(field, 'Please enter a valid email address');
        return false;
    }
    
    if (field.id === 'message' && value.length < 10) {
        showError(field, 'Message must be at least 10 characters');
        return false;
    }
    
    return true;
};

/**
 * Initialize contact form
 */
const initContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Real-time validation on blur
    const formFields = contactForm.querySelectorAll('input, textarea');
    formFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('is-invalid')) {
                validateField(field);
            }
        });
    });
    
    // Form submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isValid = true;
        formFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            // Focus on first invalid field
            const firstInvalid = contactForm.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
            return;
        }
        
        // Get form data
        const formData = {
            name: contactForm.querySelector('#name').value,
            email: contactForm.querySelector('#email').value,
            subject: contactForm.querySelector('#subject').value,
            message: contactForm.querySelector('#message').value
        };
        
        // Disable submit button
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        
        // Simulate form submission (replace with actual API call)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success
            showSuccessMessage();
            contactForm.reset();
            
        } catch (error) {
            // Error
            showErrorMessage('Something went wrong. Please try again.');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = originalBtnText;
        }
    });
};

/**
 * Show success message
 */
const showSuccessMessage = () => {
    const message = createNotification(
        'Thank you for your message! We will get back to you soon.',
        'success'
    );
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => message.remove(), 300);
    }, 5000);
};

/**
 * Show error message
 */
const showErrorMessage = (text) => {
    const message = createNotification(text, 'error');
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => message.remove(), 300);
    }, 5000);
};

/**
 * Create notification element
 */
const createNotification = (text, type) => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = text;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: ${type === 'success' ? 'var(--color-accent-green)' : '#ff4444'};
        color: var(--color-primary);
        font-family: var(--font-heading);
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    return notification;
};

// Add styles for notification show state
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        opacity: 1 !important;
        transform: translateX(0) !important;
    }
`;
document.head.appendChild(style);

// ==========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ==========================================

/**
 * Initialize intersection observer for fade-in animations
 */
const initScrollAnimations = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
};

// Add animation styles
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(animationStyle);

// ==========================================
// PERFORMANCE OPTIMIZATIONS
// ==========================================

/**
 * Lazy load images
 */
const initLazyLoading = () => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports lazy loading
        return;
    }
    
    // Fallback for browsers that don't support lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
};

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize all functionality when DOM is ready
 */
const init = () => {
    // Mobile menu
    initMobileMenu();
    
    // Smooth scroll
    initSmoothScroll();
    
    // Scroll effects
    window.addEventListener('scroll', handleNavbarScroll);
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Form
    initContactForm();
    
    // Animations
    initScrollAnimations();
    
    // Lazy loading
    initLazyLoading();
    
    // Initial calls
    handleNavbarScroll();
    updateActiveNavLink();
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * Global error handler
 */
window.addEventListener('error', (e) => {
    console.error('An error occurred:', e.error);
    // You can send this to an error tracking service
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // You can send this to an error tracking service
});
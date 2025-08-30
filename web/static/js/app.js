// Top Vitamin Supply - Main JavaScript

// Hotwire/Turbo Setup
import { Application } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// Initialize Stimulus
const application = Application.start()

// Configure Stimulus development mode
application.debug = false
window.Stimulus = application

// Turbo Configuration
Turbo.setProgressBarDelay(100)

// Auto-slug generation for post forms
document.addEventListener('DOMContentLoaded', function() {
    const titleInput = document.getElementById('title')
    const slugInput = document.getElementById('slug')
    
    if (titleInput && slugInput) {
        titleInput.addEventListener('input', function() {
            const title = this.value
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-')
            slugInput.value = slug
        })
    }
})

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form[data-turbo="false"]')
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault()
            
            const submitBtn = form.querySelector('button[type="submit"]')
            const originalText = submitBtn.textContent
            
            // Show loading state
            submitBtn.disabled = true
            submitBtn.innerHTML = '<span class="spinner"></span> Loading...'
            
            try {
                const formData = new FormData(form)
                const data = {}
                
                // Convert FormData to object
                for (let [key, value] of formData.entries()) {
                    if (key === 'published') {
                        data[key] = value === 'on'
                    } else {
                        data[key] = value
                    }
                }
                
                // Determine method and URL
                const method = formData.get('_method') || form.method.toUpperCase()
                const url = form.action
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                
                const result = await response.json()
                
                if (response.ok && result.success) {
                    // Success - redirect or show message
                    if (result.redirect) {
                        window.location.href = result.redirect
                    } else if (result.message) {
                        showNotification(result.message, 'success')
                    }
                } else {
                    // Error
                    showNotification(result.error || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Form submission error:', error)
                showNotification('Network error. Please try again.', 'error')
            } finally {
                // Reset button state
                submitBtn.disabled = false
                submitBtn.textContent = originalText
            }
        })
    })
})

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification')
    if (existing) {
        existing.remove()
    }
    
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm`
    
    // Set styles based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#dcfce7'
            notification.style.color = '#166534'
            notification.style.border = '1px solid #bbf7d0'
            break
        case 'error':
            notification.style.backgroundColor = '#fef2f2'
            notification.style.color = '#dc2626'
            notification.style.border = '1px solid #fecaca'
            break
        case 'warning':
            notification.style.backgroundColor = '#fffbeb'
            notification.style.color = '#d97706'
            notification.style.border = '1px solid #fed7aa'
            break
        default:
            notification.style.backgroundColor = '#eff6ff'
            notification.style.color = '#2563eb'
            notification.style.border = '1px solid #bfdbfe'
    }
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-500 hover:text-gray-700">
                ×
            </button>
        </div>
    `
    
    document.body.appendChild(notification)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove()
        }
    }, 5000)
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search')
    const searchResults = document.getElementById('search-results')
    
    if (searchInput && searchResults) {
        let searchTimeout
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout)
            const query = this.value.trim()
            
            if (query.length < 2) {
                searchResults.innerHTML = ''
                searchResults.style.display = 'none'
                return
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
                    const results = await response.json()
                    
                    if (results.success && results.data.length > 0) {
                        displaySearchResults(results.data)
                    } else {
                        searchResults.innerHTML = '<p class="p-4 text-gray-500">No results found</p>'
                        searchResults.style.display = 'block'
                    }
                } catch (error) {
                    console.error('Search error:', error)
                }
            }, 300)
        })
        
        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none'
            }
        })
    }
})

function displaySearchResults(posts) {
    const searchResults = document.getElementById('search-results')
    
    const html = posts.map(post => `
        <a href="/post/${post.id}" class="block p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
            <h4 class="font-medium text-gray-900">${post.title}</h4>
            <p class="text-sm text-gray-600 mt-1">${post.excerpt || ''}</p>
        </a>
    `).join('')
    
    searchResults.innerHTML = html
    searchResults.style.display = 'block'
}

// Markdown preview functionality
document.addEventListener('DOMContentLoaded', function() {
    const contentInput = document.getElementById('content')
    const previewArea = document.getElementById('preview')
    const previewToggle = document.getElementById('preview-toggle')
    
    if (contentInput && previewArea && previewToggle) {
        previewToggle.addEventListener('click', function() {
            const isPreview = previewArea.style.display !== 'none'
            
            if (isPreview) {
                // Show editor
                contentInput.style.display = 'block'
                previewArea.style.display = 'none'
                previewToggle.textContent = 'Preview'
            } else {
                // Show preview
                contentInput.style.display = 'none'
                previewArea.style.display = 'block'
                previewToggle.textContent = 'Edit'
                
                // Convert markdown to HTML (simple conversion)
                const markdown = contentInput.value
                const html = convertMarkdown(markdown)
                previewArea.innerHTML = html
            }
        })
    }
})

// Simple markdown to HTML converter
function convertMarkdown(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|li|ul|ol])/gm, '<p>')
        .replace(/$/gm, '</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<li>.*<\/li>)<\/p>/g, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/g, '')
}

// Lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img[data-src]')
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target
                img.src = img.dataset.src
                img.classList.remove('lazy')
                imageObserver.unobserve(img)
            }
        })
    })
    
    images.forEach(img => imageObserver.observe(img))
})

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]')
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            const target = document.querySelector(this.getAttribute('href'))
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        })
    })
})

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle')
    const mobileMenu = document.getElementById('mobile-menu')
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            const isOpen = mobileMenu.classList.contains('hidden')
            
            if (isOpen) {
                mobileMenu.classList.remove('hidden')
                menuToggle.setAttribute('aria-expanded', 'true')
            } else {
                mobileMenu.classList.add('hidden')
                menuToggle.setAttribute('aria-expanded', 'false')
            }
        })
    }
})

// Export for use in templates
window.TopVitaminSupply = {
    showNotification,
    convertMarkdown,
    displaySearchResults
}

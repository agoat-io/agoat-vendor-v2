// Blog API Client
class BlogAPI {
    constructor(baseURL = window.location.origin, apiKey = null) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
    
    // Authentication
    async login(username, password) {
        return this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
    
    async logout() {
        return this.request('/api/logout', {
            method: 'POST'
        });
    }
    
    // Posts CRUD
    async getPosts(page = 1, perPage = 10) {
        return this.request(`/api/posts?page=${page}&per_page=${perPage}`);
    }
    
    async getPost(id) {
        return this.request(`/api/posts/${id}`);
    }
    
    async createPost(post) {
        return this.request('/api/posts', {
            method: 'POST',
            body: JSON.stringify(post)
        });
    }
    
    async updatePost(id, post) {
        return this.request(`/api/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(post)
        });
    }
    
    async deletePost(id) {
        return this.request(`/api/posts/${id}`, {
            method: 'DELETE'
        });
    }
    
    // Status
    async getStatus() {
        return this.request('/api/status');
    }
}

// Global Event Bus Implementation
window.BlogEventBus = class {
    constructor() {
        this.events = {};
        this.history = [];
    }
    
    on(event, callback, options = {}) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push({
            callback,
            once: options.once || false
        });
        
        return () => this.off(event, callback);
    }
    
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(
            listener => listener.callback !== callback
        );
    }
    
    emit(event, data) {
        // Log to history
        this.history.push({
            event,
            data,
            timestamp: new Date()
        });
        
        // Keep only last 100 events
        if (this.history.length > 100) {
            this.history.shift();
        }
        
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(listener => {
            listener.callback(data);
            return !listener.once;
        });
    }
    
    getHistory(event = null) {
        if (event) {
            return this.history.filter(h => h.event === event);
        }
        return this.history;
    }
}

// Initialize global event bus if not exists
if (!window.eventBus) {
    window.eventBus = new BlogEventBus();
}

// Export for use
window.BlogAPI = BlogAPI;
-- Initialize default data for AGoat Publisher
-- This script creates a default customer and site with proper UUIDs

-- Create default customer
INSERT INTO customers (id, name, email, status, subscription_plan, max_sites, max_storage_gb, max_bandwidth_gb, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Default Customer',
    'admin@agoat-publisher.com',
    'active',
    'basic',
    10,
    100,
    1000,
    current_timestamp(),
    current_timestamp()
) ON CONFLICT DO NOTHING;

-- Create default site for the default customer
INSERT INTO sites (id, customer_id, name, slug, status, template, settings, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    c.id,
    'Default Site',
    'default-site',
    'active',
    'default',
    '{}',
    current_timestamp(),
    current_timestamp()
FROM customers c 
WHERE c.name = 'Default Customer'
ON CONFLICT DO NOTHING;

-- Create a default user
INSERT INTO users (id, username, email, password_hash, customer_id, site_id, role, status, created_at)
SELECT 
    gen_random_uuid(),
    'admin',
    'admin@agoat-publisher.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    c.id,
    s.id,
    'admin',
    'active',
    current_timestamp()
FROM customers c, sites s
WHERE c.name = 'Default Customer' AND s.name = 'Default Site'
ON CONFLICT DO NOTHING;

-- Create some sample posts
INSERT INTO posts (id, user_id, site_id, title, content, slug, status, published, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    s.id,
    'Welcome to AGoat Publisher',
    '# Welcome to AGoat Publisher

This is your first blog post. You can edit this post or create new ones from the dashboard.

## Features

- **Multitenancy**: Support for multiple customers and sites
- **Markdown Support**: Write posts in Markdown
- **Modern UI**: Built with React and Radix UI
- **Scalable**: Powered by CockroachDB

Start writing your content today!',
    'welcome-to-agoat-publisher',
    'published',
    true,
    current_timestamp(),
    current_timestamp()
FROM users u, sites s
WHERE u.username = 'admin' AND s.name = 'Default Site'
ON CONFLICT DO NOTHING;

INSERT INTO posts (id, user_id, site_id, title, content, slug, status, published, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    s.id,
    'Getting Started Guide',
    '# Getting Started Guide

Here''s how to get started with AGoat Publisher:

## 1. Create Your First Post

Navigate to the dashboard and click "New Post" to create your first blog post.

## 2. Customize Your Site

You can customize your site settings and template from the dashboard.

## 3. Publish Content

Write your content in Markdown and publish it for your readers.

Happy blogging!',
    'getting-started-guide',
    'published',
    true,
    current_timestamp(),
    current_timestamp()
FROM users u, sites s
WHERE u.username = 'admin' AND s.name = 'Default Site'
ON CONFLICT DO NOTHING;

-- Display the created data
SELECT 'Default Customer' as type, id, name FROM customers WHERE name = 'Default Customer';
SELECT 'Default Site' as type, id, name, customer_id FROM sites WHERE name = 'Default Site';
SELECT 'Default User' as type, id, username, customer_id, site_id FROM users WHERE username = 'admin';
SELECT 'Sample Posts' as type, id, title, site_id FROM posts WHERE title LIKE '%Welcome%' OR title LIKE '%Getting Started%';

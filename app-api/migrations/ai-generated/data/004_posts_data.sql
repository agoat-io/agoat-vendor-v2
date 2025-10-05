-- AGoat Publisher - Posts Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for posts table

-- =============================================================================
-- POSTS DATA
-- =============================================================================

-- Insert posts data
INSERT INTO posts (
    id,
    user_id,
    title,
    content,
    slug,
    published,
    created_at,
    updated_at,
    site_id,
    status,
    published_at,
    deleted_at
) VALUES 
-- Post 1
(
    1111539353331236865,
    1096773348868587521,
    'Welcome to Top Vitamin Supply',
    '<h1>Welcome to Top Vitamin Supply</h1><p>Your trusted source for professional-grade supplements and practitioner resources.</p>',
    'welcome-to-top-vitamin-supply',
    true,
    '2024-01-15 11:00:00+00',
    '2024-01-15 11:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-01-15 11:00:00+00',
    NULL
),
-- Post 2
(
    1111539353331236866,
    1096773348868587521,
    'About Our Products',
    '<h2>About Our Products</h2><p>We offer a comprehensive range of high-quality supplements designed for healthcare professionals and their patients.</p>',
    'about-our-products',
    true,
    '2024-01-16 09:00:00+00',
    '2024-01-16 09:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-01-16 09:00:00+00',
    NULL
),
-- Post 3
(
    1111539353331236867,
    1096773348868587521,
    'Practitioner Resources',
    '<h2>Practitioner Resources</h2><p>Access our comprehensive library of clinical research, dosing guidelines, and patient education materials.</p>',
    'practitioner-resources',
    true,
    '2024-01-17 10:00:00+00',
    '2024-01-17 10:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-01-17 10:00:00+00',
    NULL
),
-- Post 4
(
    1111539353331236868,
    1096773348868587521,
    'Quality Assurance',
    '<h2>Quality Assurance</h2><p>Learn about our rigorous quality control processes and third-party testing standards.</p>',
    'quality-assurance',
    true,
    '2024-01-18 11:00:00+00',
    '2024-01-18 11:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-01-18 11:00:00+00',
    NULL
),
-- Post 5
(
    1111539353331236869,
    1096773348868587521,
    'Contact Information',
    '<h2>Contact Information</h2><p>Get in touch with our team for product inquiries, support, and partnership opportunities.</p>',
    'contact-information',
    true,
    '2024-01-19 12:00:00+00',
    '2024-01-19 12:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-01-19 12:00:00+00',
    NULL
),
-- Post 6
(
    1111539353331236870,
    1096773348868587521,
    'Draft Post Example',
    '<h2>Draft Post</h2><p>This is a draft post that has not been published yet.</p>',
    'draft-post-example',
    false,
    '2024-01-20 13:00:00+00',
    '2024-01-20 13:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'draft',
    NULL,
    NULL
),
-- Post 7
(
    1111539353331236871,
    1096773348868587521,
    'Test Post 1',
    '<h2>Test Post 1</h2><p>This is a test post for development purposes.</p>',
    'test-post-1',
    true,
    '2024-10-01 14:00:00+00',
    '2024-10-01 14:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-10-01 14:00:00+00',
    NULL
),
-- Post 8
(
    1111539353331236872,
    1096773348868587521,
    'Test Post 2',
    '<h2>Test Post 2</h2><p>Another test post for development purposes.</p>',
    'test-post-2',
    true,
    '2024-10-02 15:00:00+00',
    '2024-10-02 15:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-10-02 15:00:00+00',
    NULL
),
-- Post 9
(
    1111539353331236873,
    1096773348868587521,
    'Test Post 3',
    '<h2>Test Post 3</h2><p>Third test post for development purposes.</p>',
    'test-post-3',
    true,
    '2024-10-03 16:00:00+00',
    '2024-10-03 16:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-10-03 16:00:00+00',
    NULL
),
-- Post 10
(
    1111539353331236874,
    1096773348868587521,
    'Test Post 4',
    '<h2>Test Post 4</h2><p>Fourth test post for development purposes.</p>',
    'test-post-4',
    true,
    '2024-10-04 17:00:00+00',
    '2024-10-04 17:00:00+00',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'published',
    '2024-10-04 17:00:00+00',
    NULL
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE posts IS 'Content posts with multi-tenant support and soft delete - Contains 10 posts (9 published, 1 draft)';

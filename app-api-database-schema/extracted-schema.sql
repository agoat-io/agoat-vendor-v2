-- Extracted Database Schema
-- Generated automatically from live database

-- Table: posts
CREATE TABLE posts (id bigint NOT NULL DEFAULT unique_rowid(), user_id bigint, title character varying(255) NOT NULL, content text NOT NULL, slug character varying(255) NOT NULL, published boolean DEFAULT false, created_at timestamp without time zone DEFAULT current_timestamp(), updated_at timestamp without time zone DEFAULT current_timestamp());

-- Index: idx_posts_published
CREATE INDEX idx_posts_published ON posts (published ASC);

-- Index: idx_posts_slug
CREATE INDEX idx_posts_slug ON posts (slug ASC);

-- Index: posts_slug_key
CREATE INDEX posts_slug_key ON posts (slug ASC);

-- Table: users
CREATE TABLE users (id bigint NOT NULL DEFAULT unique_rowid(), username character varying(255) NOT NULL, email character varying(255) NOT NULL, password_hash character varying(255) NOT NULL, created_at timestamp without time zone DEFAULT current_timestamp());

-- Index: users_email_key
CREATE INDEX users_email_key ON users (email ASC);

-- Index: users_username_key
CREATE INDEX users_username_key ON users (username ASC);


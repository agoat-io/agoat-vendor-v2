
# Extracted Database Schema

This schema was automatically extracted from the live database.

## Tables


### posts

**Columns:**

- **id** (bigint) - PRIMARY KEY - NOT NULL - DEFAULT: unique_rowid()

- **user_id** (bigint)

- **title** (character varying) - NOT NULL

- **content** (text) - NOT NULL

- **slug** (character varying) - NOT NULL

- **published** (boolean) - DEFAULT: false

- **created_at** (timestamp without time zone) - DEFAULT: current_timestamp()

- **updated_at** (timestamp without time zone) - DEFAULT: current_timestamp()



**Indexes:**

- **idx_posts_published** (btree) on (published ASC)

- **idx_posts_slug** (btree) on (slug ASC)

- **posts_slug_key** (btree) - UNIQUE on (slug ASC)




**Foreign Keys:**

- **user_id** → users.id




### users

**Columns:**

- **id** (bigint) - PRIMARY KEY - NOT NULL - DEFAULT: unique_rowid()

- **username** (character varying) - NOT NULL

- **email** (character varying) - NOT NULL

- **password_hash** (character varying) - NOT NULL

- **created_at** (timestamp without time zone) - DEFAULT: current_timestamp()



**Indexes:**

- **users_email_key** (btree) - UNIQUE on (email ASC)

- **users_username_key** (btree) - UNIQUE on (username ASC)







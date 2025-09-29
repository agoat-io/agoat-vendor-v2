# Schema Comparison Tools

This directory contains tools for comparing and migrating database schemas efficiently in CockroachDB.

## 🎯 **Available Tools**

### **Atlas - Go-Based Tool**
**Atlas** is excellent for schema comparison because it's:
- ✅ **100% Free & Open Source** (Apache 2.0 license)
- ✅ **Go-based** (like your project)
- ✅ **Excellent CockroachDB support**
- ✅ **Built-in schema comparison**
- ✅ **Modern and actively maintained**

### **Flyway - SQL-First Tool**
**Flyway** is excellent for migration management because it's:
- ✅ **100% Free & Open Source** (Apache 2.0 license)
- ✅ **SQL-first approach**
- ✅ **Excellent CockroachDB support**
- ✅ **Mature and stable**
- ✅ **Version control integration**

## 📦 Installation

### Install Atlas
```bash
# Install Atlas (completely free)
curl -sSf https://atlasgo.io/install.sh | sh

# Verify installation
atlas version
```

### Install Flyway
```bash
# Install Flyway (completely free)
brew install flyway

# Verify installation
flyway -version
```

## 🚀 Quick Start

### **Atlas - Schema Comparison**
```bash
# 1. Compare Two Database Schemas
./tools/schema-diff/atlas-integration.sh compare \
  postgresql://source:5432/db \
  postgresql://target:5432/db

# 2. Generate Migration from Schema Changes
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://staging:5432/db \
  add_users_table

# 3. Inspect Current Database Schema
./tools/schema-diff/atlas-integration.sh inspect

# 4. Validate Schema
./tools/schema-diff/atlas-integration.sh validate
```

### **Flyway - Migration Management**
```bash
# 1. Setup Flyway for the project
./tools/schema-diff/flyway-integration.sh setup

# 2. Check migration status
./tools/schema-diff/flyway-integration.sh status

# 3. Run migrations
./tools/schema-diff/flyway-integration.sh migrate

# 4. Create new migration
./tools/schema-diff/flyway-integration.sh create-migration add_users_table
```

## 📖 Usage Examples

### **Atlas Examples**

#### Compare Development vs Production
```bash
# Compare your development database with production
./tools/schema-diff/atlas-integration.sh compare \
  postgresql://dev:5432/agoat_publish \
  postgresql://prod:5432/agoat_publish
```

#### Generate Migration from Staging
```bash
# Generate migration from staging database changes
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://staging:5432/agoat_publish \
  add_multitenancy_support
```

#### Inspect Current Schema
```bash
# See what tables and structure you have
./tools/schema-diff/atlas-integration.sh inspect
```

### **Flyway Examples**

#### Setup and Run Migrations
```bash
# Setup Flyway for the project
./tools/schema-diff/flyway-integration.sh setup

# Check current migration status
./tools/schema-diff/flyway-integration.sh status

# Run all pending migrations
./tools/schema-diff/flyway-integration.sh migrate

# Create a new migration
./tools/schema-diff/flyway-integration.sh create-migration add_user_roles
```

#### Compare Database Schemas
```bash
# Compare two database schemas
./tools/schema-diff/flyway-integration.sh compare \
  postgresql://dev:5432/agoat_publish \
  postgresql://prod:5432/agoat_publish
```

## 🔧 Integration with Migration Tools

### **Atlas Integration**
The Atlas integration works seamlessly with your existing migration tool:

1. **Generate Migration with Atlas**
   ```bash
   ./tools/schema-diff/atlas-integration.sh generate-migration \
     postgresql://source:5432/db \
     my_migration_name
   ```

2. **Apply with Your Migration Tool**
   ```bash
   ./tools/dbmigrate/start-migration.sh up
   ```

### **Flyway Integration**
Flyway provides its own migration management:

1. **Setup Flyway**
   ```bash
   ./tools/schema-diff/flyway-integration.sh setup
   ```

2. **Run Migrations**
   ```bash
   ./tools/schema-diff/flyway-integration.sh migrate
   ```

3. **Check Status**
   ```bash
   ./tools/schema-diff/flyway-integration.sh status
   ```

## 📊 Output Files

Generated files are stored in `tools/schema-diff/output/`:

- **`schema_diff.sql`** - Schema differences between databases
- **`current_schema.sql`** - Current database schema snapshot
- **`migration_name.sql`** - Generated migration files

## 🎯 Tool Comparison

### **Atlas vs Flyway**

#### **Atlas Advantages:**
- ✅ **Schema comparison** built-in
- ✅ **More modern** architecture
- ✅ **Better CLI** experience
- ✅ **Go ecosystem** integration
- ✅ **Declarative** schema management

#### **Flyway Advantages:**
- ✅ **Mature and stable** (longer history)
- ✅ **SQL-first** approach
- ✅ **Better documentation**
- ✅ **More plugins** available
- ✅ **Enterprise features** (in paid version)

### **vs Other Tools**

#### **vs Liquibase**
- ✅ **Completely free** (no commercial restrictions)
- ✅ **Simpler setup** (no Java dependencies)
- ✅ **Better CockroachDB support**

#### **vs SchemaHero**
- ✅ **No Kubernetes** requirement
- ✅ **Simpler** for standalone use
- ✅ **Better** for your current setup

## 🔍 Advanced Usage

### **Atlas Direct Commands**
```bash
# Compare schemas directly
atlas schema diff \
  --from "postgresql://source:5432/db" \
  --to "postgresql://target:5432/db" \
  --dev-url "postgresql://dev:5432/db"

# Inspect schema
atlas schema inspect \
  --url "postgresql://db:5432/db" \
  --format "{{ sql . \"  \" }}"

# Generate migration
atlas migrate diff migration_name \
  --dev-url "postgresql://db:5432/db" \
  --to "postgresql://target:5432/db"
```

### **Atlas Custom Formats**
```bash
# JSON format
atlas schema inspect --url "$DSN" --format "{{ json . }}"

# Table list only
atlas schema inspect --url "$DSN" --format "{{ range .Tables }}{{ .Name }}{{ \"\n\" }}{{ end }}"

# SQL with custom formatting
atlas schema inspect --url "$DSN" --format "{{ sql . \"    \" }}"
```

### **Flyway Direct Commands**
```bash
# Run migrations with custom config
flyway -configFiles=flyway.conf migrate

# Validate migrations
flyway -configFiles=flyway.conf validate

# Repair schema history
flyway -configFiles=flyway.conf repair

# Clean database (WARNING: drops all tables)
flyway -configFiles=flyway.conf clean
```

### **Flyway Configuration**
```bash
# Create custom Flyway config
cat > flyway.conf << EOF
flyway.url=$DSN
flyway.user=username
flyway.password=password
flyway.locations=filesystem:migrations
flyway.sqlMigrationPrefix=V
flyway.sqlMigrationSeparator=__
flyway.sqlMigrationSuffixes=.sql
flyway.validateOnMigrate=true
EOF
```

## 🛡️ Safety Features

### Backup Before Comparison
```bash
# Always backup before major schema changes
cockroach dump --host=localhost:26257 --database=agoat_publish > backup.sql
```

### Dry Run Mode
```bash
# Preview changes without applying
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://source:5432/db \
  preview_changes

# Review the generated migration before applying
cat tools/schema-diff/output/preview_changes.sql
```

## 🔧 Configuration

### Environment Variables
The tool uses the same environment variables as your migration tool:
- `DSN` - Database connection string
- `CA` - Database CA certificate
- `DB_DRIVER` - Database driver (default: postgres)

### GCP Secrets Integration
Automatically loads secrets from Google Cloud:
- `agoat-publisher-db-main-cockroach-ca`
- `agoat-publisher-db-main-cockroach-dsn`

## 📚 Best Practices

### 1. **Always Backup First**
```bash
# Create backup before schema changes
cockroach dump --host=localhost:26257 --database=agoat_publish > backup.sql
```

### 2. **Test on Staging**
```bash
# Test schema changes on staging first
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://staging:5432/agoat_publish \
  test_migration
```

### 3. **Review Generated Migrations**
```bash
# Always review before applying
cat tools/schema-diff/output/migration_name.sql
```

### 4. **Use Descriptive Names**
```bash
# Good migration names
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://source:5432/db \
  add_multitenancy_support

# Bad migration names
./tools/schema-diff/atlas-integration.sh generate-migration \
  postgresql://source:5432/db \
  update
```

## 🚨 Troubleshooting

### Common Issues

#### Atlas Not Found
```bash
# Install Atlas
curl -sSf https://atlasgo.io/install.sh | sh

# Verify installation
atlas version
```

#### Connection Errors
```bash
# Check database connectivity
cockroach sql --url="postgresql://host:26257/db"

# Verify secrets are loaded
echo $DSN
echo $CA
```

#### Permission Issues
```bash
# Make script executable
chmod +x tools/schema-diff/atlas-integration.sh
```

### Debug Mode
```bash
# Enable verbose output
atlas schema diff --verbose \
  --from "postgresql://source:5432/db" \
  --to "postgresql://target:5432/db"
```

## 🔗 Resources

- **Atlas Documentation**: https://atlasgo.io/docs
- **Atlas GitHub**: https://github.com/ariga/atlas
- **CockroachDB Schema Design**: https://www.cockroachlabs.com/docs/stable/schema-design-overview.html

## 🎉 Benefits

### **Atlas Benefits:**
1. **Efficiency** - Automatically detect schema differences
2. **Accuracy** - No manual schema comparison errors
3. **Safety** - Preview changes before applying
4. **Integration** - Works with your existing migration tool
5. **Cost** - Completely free and open source

### **Flyway Benefits:**
1. **Maturity** - Battle-tested in production environments
2. **SQL-First** - Pure SQL migrations, no abstraction layers
3. **Version Control** - Excellent Git integration
4. **Reliability** - Transaction safety and rollback support
5. **Community** - Large, active community and documentation

---

**Note**: Both Atlas and Flyway are excellent free and open source tools. Choose Atlas for schema comparison and Flyway for migration management, or use either tool based on your specific needs.

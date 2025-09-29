# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the AGoat Publisher database design and implementation.

## Overview

Architecture Decision Records are documents that capture important architectural decisions made during the development of the system. They provide context for why certain decisions were made and help future developers understand the reasoning behind the current architecture.

## ADR Format

Each ADR follows this format:

- **Status**: Current status of the decision (Proposed, Accepted, Deprecated, etc.)
- **Context**: The situation that led to the decision
- **Decision**: The decision that was made
- **Rationale**: Why this decision was made
- **Consequences**: The positive and negative consequences of the decision
- **Implementation Details**: How the decision is implemented
- **References**: Links to relevant documentation and resources

## ADR List

### ADR 00001: Multitenancy Database Design for CockroachDB
**Status**: Accepted  
**Date**: 2025-08-31  
**Description**: Database design decisions for implementing multitenancy with CockroachDB

**Key Decisions**:
- Use UUID-based primary keys for even distribution
- Implement tenant-aware indexing for efficient queries
- Use logical partitioning through tenant context
- Optimize key design to avoid hotspots

**Rationale**:
- UUIDs distribute writes evenly across all nodes in CockroachDB
- Tenant-aware indexing provides fast query performance
- Logical partitioning allows flexibility while maintaining isolation
- Optimized key design prevents hotspots and ensures scalability

### ADR 00002: OIDC-Agnostic Authentication Architecture
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: OIDC-compliant authentication system supporting multiple identity providers

**Key Decisions**:
- Generic OIDC-compliant database schema
- Provider-specific data in JSONB fields
- Multiple instances of same provider type support
- PKCE and state parameters for security
- Automatic token refresh capabilities

**Rationale**:
- Provider flexibility with OIDC standard compliance
- Future-proofing with generic schema
- Multi-instance support for different environments
- Modern OAuth2 security practices
- Seamless user experience with state preservation

### ADR 00003: Database Architecture and Multitenancy
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Comprehensive database architecture supporting multitenancy and business domains

**Key Decisions**:
- CockroachDB for distributed database hosting
- UUID-based primary keys for even distribution
- Tenant-aware indexing for efficient queries
- Separate schemas for different business domains
- Comprehensive audit trails and data versioning

**Rationale**:
- Horizontal scaling with CockroachDB
- Complete tenant separation and data isolation
- Optimized performance for distributed queries
- ACID compliance and fault tolerance
- Support for multiple business domains

### ADR 00004: Frontend Architecture and Technology Stack
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Modern React-based frontend with comprehensive UI/UX capabilities

**Key Decisions**:
- React 18 with TypeScript for type safety
- Vite as build tool for fast development
- Radix UI for accessible components
- Tailwind CSS 4.1.12 for utility-first styling
- Wysimark for rich text editing
- DOMPurify for content sanitization

**Rationale**:
- Modern React features and performance improvements
- Type safety reduces runtime errors
- Fast development with Vite
- Built-in accessibility with Radix UI
- Consistent, maintainable styling
- Modern rich text editing capabilities

### ADR 00005: Backend Architecture and API Design
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Go-based backend with RESTful API design and comprehensive features

**Key Decisions**:
- Go 1.24.2 for high performance and concurrency
- Gorilla Mux for HTTP routing and middleware
- Gorilla Sessions for secure session management
- PostgreSQL driver for database connectivity
- Structured logging with JSON format
- RESTful API design with clear resource endpoints

**Rationale**:
- Excellent performance and low memory footprint
- Native goroutines for concurrent requests
- Strong typing and error handling
- Rich ecosystem with mature libraries
- Single binary deployment
- Simple, readable codebase

### ADR 00006: Deployment and Infrastructure Architecture
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Cloud-native deployment architecture with GCP and containerization

**Key Decisions**:
- Google Cloud Platform as primary cloud provider
- CockroachDB for distributed database hosting
- Google Cloud Secrets Manager for configuration
- Docker containers for application deployment
- Local development environment with unified startup
- Environment-specific configurations

**Rationale**:
- Managed services and scalability
- Distributed, fault-tolerant database
- Secure configuration management
- Consistent deployment across environments
- Fast local development with hot reload
- Cloud-native architecture supports growth

### ADR 00007: Security Architecture and Implementation
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Comprehensive security architecture with modern authentication and protection

**Key Decisions**:
- OIDC-compliant authentication with PKCE
- Token-based security with secure storage
- Content sanitization to prevent XSS
- Input validation and SQL injection prevention
- Audit logging for security events
- Role-based access control (RBAC)

**Rationale**:
- Industry-standard authentication
- Modern OAuth2 security practices
- Protection against common web vulnerabilities
- Comprehensive data protection
- Regulatory compliance support
- Fine-grained authorization control

### ADR 00008: Content Management and Business Domain Architecture
**Status**: Accepted  
**Date**: 2024-09-28  
**Description**: Hybrid content management supporting both general content and business domains

**Key Decisions**:
- Unified content management for blog posts
- Business domain separation for Thorne functionality
- Rich text editing with Wysimark and markdown
- Content versioning and status management
- Media management with optimization
- SEO optimization with meta tags

**Rationale**:
- Flexible content management system
- Specific business domain support
- Modern content creation tools
- Content quality through versioning
- Optimized content delivery
- Security through content sanitization

## Decision Process

### When to Create an ADR
Create an ADR when making decisions about:
- Database schema design
- Indexing strategies
- Performance optimizations
- Security implementations
- Scalability approaches
- Technology choices that affect the database

### ADR Lifecycle
1. **Proposed**: Initial proposal for a decision
2. **Under Review**: Decision is being reviewed by stakeholders
3. **Accepted**: Decision has been accepted and will be implemented
4. **Implemented**: Decision has been implemented in the system
5. **Deprecated**: Decision has been superseded by a newer decision

### Review Process
1. **Proposal**: Create ADR with proposed decision
2. **Review**: Stakeholders review and provide feedback
3. **Discussion**: Address concerns and refine the decision
4. **Approval**: Decision is approved by relevant stakeholders
5. **Implementation**: Decision is implemented in the system

## Best Practices

### Writing ADRs
1. **Be Specific**: Clearly state what decision was made
2. **Provide Context**: Explain why the decision was necessary
3. **Document Rationale**: Explain why this option was chosen over others
4. **Consider Consequences**: Document both positive and negative consequences
5. **Include Implementation Details**: Provide enough detail for implementation

### Maintaining ADRs
1. **Keep Updated**: Update ADRs when decisions change
2. **Version Control**: Keep ADRs in version control
3. **Link to Code**: Link ADRs to relevant code and documentation
4. **Review Regularly**: Periodically review ADRs for relevance
5. **Archive Deprecated**: Archive ADRs that are no longer relevant

## Related Documentation

- [Database Migrations](../../app-api-database-schema/migrations/README.md)
- [Extracted Schema](../../app-api-database-schema/EXTRACTED-SCHEMA.md)
- [CockroachDB Best Practices](https://www.cockroachlabs.com/docs/stable/best-practices.html)
- [CockroachDB Performance Tuning](https://www.cockroachlabs.com/docs/stable/performance-tuning.html)

## Contributing

When contributing to the database design:

1. **Review Existing ADRs**: Understand previous decisions
2. **Create New ADRs**: Document new architectural decisions
3. **Update Existing ADRs**: Update when decisions change
4. **Link to Code**: Link ADRs to relevant code changes
5. **Follow Process**: Follow the established review process

## Contact

For questions about ADRs or database architecture decisions, contact the database team or refer to the relevant ADR documentation.

# Technical Implementation Documentation

This folder contains technical implementation details, architecture documentation, and design specifications for the AGoat Publisher system.

## Folder Structure

### `/authentication/`
Contains authentication system implementation details:
- `oidc-agnostic-ciam.md` - OIDC-agnostic CIAM implementation
- `multiple-providers-same-type.md` - Multiple provider support implementation
- Additional authentication implementation documents

### `/database/`
Contains database implementation details:
- `database-schema-analysis.md` - Database schema analysis and design
- Additional database implementation documents

### `/features/`
Contains feature implementation details:
- `cognito-return-url-state.md` - Return URL state feature implementation
- Additional feature implementation documents

### `/api/`
Contains API implementation details:
- API specifications and documentation
- Endpoint implementation details
- Integration guides

## Content Guidelines

### Technical Implementation Documents Should Contain:
- **Architecture Details**: System architecture and design
- **Implementation Specifications**: How features are implemented
- **Code Examples**: Relevant code snippets and examples
- **Database Schemas**: Database design and schema details
- **API Specifications**: API endpoints and specifications
- **Configuration Details**: System configuration and setup
- **Integration Details**: How components integrate
- **Technical Decisions**: Technical choices and rationale

### Technical Implementation Documents Should NOT Contain:
- Pure requirements (use `/docs/requirements/` instead)
- Business rules and user stories
- High-level business objectives
- Non-technical acceptance criteria

## Document Types

### Architecture Documents
- System architecture overview
- Component relationships
- Data flow diagrams
- Integration patterns
- Technology choices

### Implementation Guides
- Step-by-step implementation instructions
- Code examples and snippets
- Configuration procedures
- Setup and deployment guides
- Troubleshooting guides

### API Documentation
- Endpoint specifications
- Request/response formats
- Authentication requirements
- Error handling
- Rate limiting and quotas

### Database Documentation
- Schema design and rationale
- Table relationships
- Index strategies
- Migration procedures
- Performance considerations

## Quality Standards

All technical implementation documents should be:
- **Accurate**: Reflect actual implementation
- **Complete**: Include all necessary details
- **Current**: Updated with latest changes
- **Clear**: Easy to understand and follow
- **Consistent**: Follow established patterns
- **Testable**: Include verification steps

## Maintenance

Technical implementation documents must be:
- Updated when implementation changes
- Reviewed during code reviews
- Validated against actual code
- Maintained in sync with requirements
- Version controlled with code changes

## Related Documentation

- **Requirements**: `/docs/requirements/` - What the system shall do
- **Analysis**: `/docs/analysis/` - Research and analysis
- **ADRs**: `/docs/adrs/` - Architecture decisions
- **API**: `/docs/api/` - API specifications
- **Tools**: `/docs/tools/` - Testing and tools

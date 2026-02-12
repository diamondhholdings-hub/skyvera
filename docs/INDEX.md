# Documentation Index

Complete documentation for the Skyvera Executive Intelligence System.

## Quick Links

- [README (Start Here)](../README.md) - Project overview, quick start, features
- [API Documentation](./api/README.md) - Complete API reference
- [Architecture Guide](./architecture.md) - System design and technical details
- [Deployment Guide](./deployment.md) - Production deployment instructions
- [Developer Guide](./development.md) - Contributing and extending the system
- [User Guide](./user-guide.md) - Feature walkthroughs and best practices

---

## Documentation Structure

### Root Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [README.md](../README.md) | **Start here!** Project overview, quick start (5 min), features, tech stack, troubleshooting | 350+ |

### Core Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [architecture.md](./architecture.md) | High-level architecture, technology choices, data flow, caching strategy, error handling, database schema | 800+ |
| [deployment.md](./deployment.md) | Production deployment (Vercel, Docker, AWS), database migration, monitoring, security best practices | 650+ |
| [development.md](./development.md) | Developer onboarding, project structure, adding features, testing, git workflow, common patterns | 900+ |
| [user-guide.md](./user-guide.md) | Complete feature walkthroughs, dashboard guide, account plans, queries, scenarios, tips & best practices | 850+ |

### API Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [api/README.md](./api/README.md) | API overview, authentication, error codes, rate limiting, examples | 120+ |
| [api/health.md](./api/health.md) | System health check endpoint | 90+ |
| [api/query.md](./api/query.md) | Natural language query processing (Claude-powered) | 250+ |
| [api/scenarios-analyze.md](./api/scenarios-analyze.md) | Scenario impact analysis (pricing, churn, expansion) | 350+ |
| [api/product-agent-analyze.md](./api/product-agent-analyze.md) | Pattern detection from customer data | 300+ |
| [api/product-agent-generate-prd.md](./api/product-agent-generate-prd.md) | PRD generation with priority scoring | 320+ |
| [api/seed.md](./api/seed.md) | Database seeding from Excel files | 200+ |

---

## Documentation Coverage

### Total Lines: ~4,200+ lines of documentation

**Breakdown:**
- Root README: 350 lines
- Core guides: 3,200 lines
- API documentation: 1,630 lines

### Documentation Standards

All documentation follows these principles:

1. **Clear Structure**: Table of contents, sections, subsections
2. **Examples**: Code snippets, curl commands, screenshots
3. **Diagrams**: Mermaid diagrams for architecture and flows
4. **Best Practices**: Tips, common patterns, troubleshooting
5. **Complete**: No assumptions - explain everything
6. **Searchable**: Good headings, keywords, links

---

## Getting Started Paths

### For End Users
1. Read [README.md](../README.md) - Overview and features
2. Read [User Guide](./user-guide.md) - Complete feature walkthrough
3. Explore the application

### For Developers
1. Read [README.md](../README.md) - Quick start installation
2. Read [Development Guide](./development.md) - Project structure and patterns
3. Read [Architecture Guide](./architecture.md) - Technical details
4. Start coding!

### For DevOps/SRE
1. Read [README.md](../README.md) - System overview
2. Read [Deployment Guide](./deployment.md) - Production deployment
3. Read [Architecture Guide](./architecture.md) - Infrastructure requirements
4. Deploy to production

### For Product Managers
1. Read [README.md](../README.md) - Value proposition and features
2. Read [User Guide](./user-guide.md) - Feature capabilities
3. Read [API Documentation](./api/README.md) - Integration possibilities
4. Plan your roadmap

---

## Key Topics

### Installation & Setup
- [Quick Start (5 min)](../README.md#quick-start-5-minutes)
- [Environment Configuration](../README.md#environment-configuration)
- [Database Setup](./deployment.md#database-migration)
- [Development Workflow](./development.md#development-workflow)

### Features
- [Executive Dashboard](./user-guide.md#dashboard)
- [Customer Intelligence](./user-guide.md#customer-intelligence)
- [Account Plans (7 tabs)](./user-guide.md#account-plans)
- [Natural Language Queries](./user-guide.md#natural-language-queries)
- [Scenario Modeling](./user-guide.md#scenario-modeling)
- [Product Agent](./user-guide.md#product-agent)

### Architecture
- [High-Level Architecture](./architecture.md#high-level-architecture)
- [Technology Choices](./architecture.md#technology-choices)
- [Data Flow](./architecture.md#data-flow)
- [Server vs Client Components](./architecture.md#server-vs-client-components)
- [Claude AI Integration](./architecture.md#claude-ai-integration)
- [Database Schema](./architecture.md#database-schema)

### Development
- [Project Structure](./development.md#project-structure)
- [Code Organization](./development.md#code-organization)
- [Adding New Features](./development.md#adding-new-features)
- [Adding Data Adapters](./development.md#adding-data-adapters)
- [Testing Guidelines](./development.md#testing-guidelines)
- [Git Workflow](./development.md#git-workflow)

### Deployment
- [Deploying to Vercel](./deployment.md#deploying-to-vercel)
- [Deploying to Docker](./deployment.md#deploying-to-docker)
- [Deploying to AWS](./deployment.md#deploying-to-aws)
- [Database Migration](./deployment.md#database-migration)
- [Monitoring & Logging](./deployment.md#monitoring--logging)
- [Security Best Practices](./deployment.md#security-best-practices)

### API Reference
- [Health Check](./api/health.md)
- [Natural Language Query](./api/query.md)
- [Scenario Analysis](./api/scenarios-analyze.md)
- [Pattern Detection](./api/product-agent-analyze.md)
- [PRD Generation](./api/product-agent-generate-prd.md)
- [Database Seeding](./api/seed.md)

---

## Diagrams & Visuals

### Architecture Diagrams
- [High-Level Architecture](./architecture.md#high-level-architecture) - System overview with layers
- [Data Flow (Read Path)](./architecture.md#data-flow) - Dashboard query sequence
- [Data Flow (Write Path)](./architecture.md#data-flow) - Natural language query sequence
- [Pattern Detection Flow](./architecture.md#data-flow) - Product agent workflow
- [Database Schema](./architecture.md#database-schema) - Entity-relationship diagram

### Workflow Diagrams
- [Pattern Detection Workflow](./api/product-agent-analyze.md#workflow-integration)
- [PRD Generation Sequence](./api/product-agent-generate-prd.md#workflow-integration)

---

## Troubleshooting Guides

- [Common Issues (README)](../README.md#troubleshooting)
- [Development Troubleshooting](./development.md#troubleshooting)
- [Production Issues](./deployment.md#troubleshooting-production-issues)

---

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Project Files
- [CLAUDE.md](../CLAUDE.md) - Instructions for Claude Code assistant
- [package.json](../package.json) - Dependencies and scripts
- [prisma/schema.prisma](../prisma/schema.prisma) - Database schema
- [next.config.ts](../next.config.ts) - Next.js configuration
- [tailwind.config.ts](../tailwind.config.ts) - Styling configuration

---

## Documentation Maintenance

### Updating Documentation

When making changes to the codebase:

1. **New Feature**: Update relevant docs (User Guide, API docs if applicable)
2. **Breaking Change**: Update README, Deployment Guide, and relevant API docs
3. **Bug Fix**: Update Troubleshooting sections if relevant
4. **Dependency Change**: Update README and package.json
5. **Architecture Change**: Update Architecture Guide

### Documentation Checklist

- [ ] README.md reflects current state
- [ ] API documentation matches actual endpoints
- [ ] Architecture diagrams are up to date
- [ ] User Guide includes new features
- [ ] Troubleshooting sections are current
- [ ] Examples and code snippets work
- [ ] Links are not broken
- [ ] Version numbers are current

---

## Contributing to Documentation

### Style Guide

- **Use clear headings**: Make it easy to scan
- **Include examples**: Show, don't just tell
- **Use diagrams**: Mermaid for architecture, flows
- **Be concise**: Get to the point quickly
- **Update regularly**: Keep docs in sync with code

### Documentation Templates

**API Endpoint:**
- Endpoint URL and method
- Description
- Request schema (with types)
- Response schema (with types)
- Example requests (curl, JavaScript, Python)
- Response fields table
- Error responses
- Performance notes
- Best practices

**Feature Guide:**
- Overview and value proposition
- Step-by-step instructions
- Screenshots (future)
- Tips and best practices
- Common issues and solutions
- Related features

---

## Version History

### v0.1.0 (2026-02-12)
- Initial comprehensive documentation suite
- README with quick start
- Complete API reference (7 endpoints)
- Architecture guide with diagrams
- Deployment guide (Vercel, Docker, AWS)
- Development guide for contributors
- User guide with feature walkthroughs
- Total: 4,200+ lines of documentation

---

## Feedback & Questions

For documentation improvements or questions:
- Create an issue with label `documentation`
- Submit a pull request with suggested changes
- Contact the development team

**Documentation is a living document - keep it updated!**

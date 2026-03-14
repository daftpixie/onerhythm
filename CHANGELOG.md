# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog.
This project follows semantic versioning once versioned releases begin.

## [Unreleased]

### Added
- Initial open-source repository standards
- AGENTS.md guidance
- community health files

### Changed
- fixed broken repository-local markdown links so docs work on GitHub instead of only on one local filesystem
- documented current release-health limits more explicitly in the README and launch checklists
- corrected Next.js dynamic route prop typing so `pnpm build` reflects actual web readiness
- made account export status messaging match the real request lifecycle instead of claiming immediate download readiness
- added baseline response-hardening headers in the web and API runtimes, with experimental/no-store designation on authenticated and personalized flows
- upgraded vulnerable Next.js and Python dependencies to versions that pass the current audit scans
- aligned package and Python project metadata with the repository MIT license posture

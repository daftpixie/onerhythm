# Security Policy

## Reporting a vulnerability

Please do not open public GitHub issues for security vulnerabilities.

Instead, report them privately to the maintainers once a dedicated security contact is configured.

Until a dedicated address is published, use GitHub private security reporting if enabled.

## What to include

Please include as much of the following as possible:

- affected component or file path
- steps to reproduce
- impact assessment
- proof of concept if safe to share
- suggested mitigation if known

## Sensitive areas

We treat the following areas as especially sensitive:

- upload handling
- OCR/redaction pipeline
- storage and deletion logic
- consent and data export/delete workflows
- authentication and authorization
- response headers, cache-control, and secure-cookie behavior on authenticated flows
- secrets/configuration
- any code touching health-related content generation

## Disclosure expectations

We aim to:

- acknowledge reports promptly
- validate and triage the issue
- coordinate a fix
- disclose responsibly once users are protected

## Scope note

OneRhythm handles medical-adjacent and privacy-sensitive workflows. If you are unsure whether something is a security issue, please report it.

Current repository posture:

- baseline response-hardening headers are enforced in the web and API runtimes
- authenticated and personalized flows still require staged live-demo validation before they should be described as production-ready
- a strict Content Security Policy is not yet locked down and should not be claimed as complete until browser validation is done in staging/production

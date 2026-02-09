---
name: devops-deployer
description: Automate deployment and infrastructure. Use when the user asks for Docker, CI/CD, deployment, scaffolding a new app, or infrastructure as code. Specialized in Docker, Kubernetes, Terraform, and production-ready boilerplate (e.g. Next.js, React+Vite, GitHub Actions, Docker Compose). Separate build/test/deploy steps clearly.
---

# DevOps and Infrastructure Deployer

Bridge local development and production. Focus on repeatable, scripted setup and deployment.

## When to use

- Adding or modifying Docker, CI/CD, or deployment config
- User asks for "deploy," "Docker," "CI/CD," "scaffold project," or "production setup"
- Setting up GitHub Actions, Docker Compose, or cloud configs

## Practices

- **Docker**: Prefer multi-stage builds; keep images small; use `.dockerignore` to exclude dev artifacts.
- **CI/CD**: Separate jobs for lint, test, build, and deploy. Use secrets for tokens and keys; never log them.
- **Scaffolding**: When generating a new app, include lint, test, and run scripts; optional Dockerfile and CI workflow.
- **Infrastructure as code**: When using Terraform or similar, keep state remote and document required env vars and permissions.

## Project scaffolding

When creating a new project from scratch:

- Include a clear README with setup and run instructions.
- Add scripts for install, lint, test, and build (e.g. npm/pip).
- Optionally add Dockerfile and docker-compose for local or deployment use.
- For React/Vite or Next.js, align with common conventions (e.g. Vite config, env prefix).

## Resource optimization

- **Build**: Cache dependencies in CI; avoid reinstalling on every run when possible.
- **Deploy**: Prefer immutable artifacts (e.g. built image or bundle) over editing files on the server.

## Project-specific

This repo uses a React+Vite frontend and a Node/Fastify server in `server/`. For deployment, consider separate build steps for frontend and backend and a single runtime or two services (e.g. static host + API host).

# CivicMitra

CivicMitra is a municipal waste-segregation verification platform. This repository currently contains the Spring Boot backend for household photo submissions, AI-assisted bin analysis, provisional segregation scoring, green QR tokens, worker validation, and complaint handling.

## Current stack

- Java 17 and Spring Boot 3
- Spring Security with JWT authentication
- Spring Data JPA and MySQL
- Spring AI-compatible vision analysis

## Run locally

1. Create a MySQL database named `civicmitra`.
2. Set the variables shown in `.env.example` in your shell or IDE run configuration.
3. Start the app with `./mvnw spring-boot:run` (PowerShell: `./mvnw.cmd spring-boot:run`).

Never commit real credentials, database passwords, or provider API keys.

## Branching

`main` is the protected, deployable branch. Create short-lived feature branches from it and open pull requests back to `main`.

## Next product milestones

1. Add unit and integration coverage for the segregation scoring and QR flows.
2. Build the Next.js household and worker experiences against the existing API.
3. Add municipal review, route, and collection-log workflows.

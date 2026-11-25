# Runtime with no external npm dependencies.
FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    APP_ENV=local \
    APP_VERSION=1.0.0

WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node scripts/docker-healthcheck.mjs ./scripts/docker-healthcheck.mjs

USER node
EXPOSE 8080

# Docker health status checks readiness. Configure platform-specific probes separately.
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD ["node", "/app/scripts/docker-healthcheck.mjs"]

CMD ["node", "src/main.mjs"]

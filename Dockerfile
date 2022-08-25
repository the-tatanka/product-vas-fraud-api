# Stage 1: builder - build typescript into javascript
FROM node:14-alpine as builder
WORKDIR /home/node/catenax-api
COPY --chown=node:node . .
RUN chown node:node /home/node/catenax-api
USER node
RUN npm ci --no-optional --no-audit 
RUN npm run lint 
RUN npm run test
RUN npm run build

# Stage 2: cleaner - prepare image without typescript and dev dependencies
FROM node:14-alpine as cleaner
WORKDIR /home/node/catenax-api
RUN chown node:node /home/node/catenax-api
COPY --from=builder /home/node/catenax-api/package*.json ./
COPY --from=builder /home/node/catenax-api/dist ./dist
USER node
RUN npm ci --only=production --no-optional

# Stage 3: final secured executable image
FROM gcr.io/distroless/nodejs:14
ARG API_PORT
ARG CORS_ALLOW_ORIGIN
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_NAME
ARG SENTRY_DSN
ARG SENTRY_ENVIRONMENT
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT_RESOURCE
ARG KEYCLOAK_CLIENT_ROLE
ARG KEYCLOAK_AUTH_URL
ENV API_PORT ${API_PORT:-80}
ENV CORS_ALLOW_ORIGIN ${CORS_ALLOW_ORIGIN:-http://localhost:3000}
ENV DB_HOST ${DB_HOST:-localhost}
ENV DB_PORT ${DB_PORT:-5432}
ENV DB_USER ${DB_USER:-dashboard}
ENV DB_NAME ${DB_NAME:-dashboard}
ENV SENTRY_DSN ${SENTRY_DSN:-}
ENV SENTRY_ENVIRONMENT ${SENTRY_ENVIRONMENT:-production}
ENV KEYCLOAK_REALM ${KEYCLOAK_REALM:-catenax}
ENV KEYCLOAK_CLIENT_RESOURCE ${KEYCLOAK_CLIENT_RESOURCE:-catenax-api}
ENV KEYCLOAK_CLIENT_ROLE ${KEYCLOAK_CLIENT_ROLE:-user}
ENV KEYCLOAK_AUTH_URL ${KEYCLOAK_AUTH_URL:-https://keycloak.catenax-cdq.com/auth/}
WORKDIR /home/node/catenax-api
COPY --chown=1000:1000 --from=cleaner /home/node/catenax-api ./
COPY --chown=1000:1000 --from=builder /home/node/catenax-api/src/database/migrations ./src/database/migrations/
# gcr.io/distroless/nodejs:14 has (unnamed) user 1000 prepared.
USER 1000
EXPOSE $API_PORT
# gcr.io/distroless/nodejs:14 has node installed at /nodejs/bin/node.
HEALTHCHECK --interval=5m --timeout=10s CMD ["/nodejs/bin/node", "./dist/healthcheck.js"]
# gcr.io/distroless/nodejs:14 has 'node' as entrypoint, expects script as CMD.
CMD ["-r", "source-map-support/register", "./dist/runserver.js"]

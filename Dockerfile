# Stage 1: builder - build typescript into javascript
FROM node:16-alpine as builder
WORKDIR /home/node/catenax-api
COPY --chown=node:node . .
RUN chown node:node /home/node/catenax-api
USER node
RUN npm ci --no-optional --no-audit && npm run lint && npm run build

# Stage 2: cleaner - prepare image without typescript and dev dependencies
FROM node:16-alpine as cleaner
WORKDIR /home/node/catenax-api
RUN chown node:node /home/node/catenax-api
COPY --from=builder /home/node/catenax-api/package*.json ./
COPY --from=builder /home/node/catenax-api/dist ./dist
USER node
RUN npm ci --only=production --no-optional

# Stage 3: final executable image
FROM node:16-alpine

ENV API_PORT=8080
ENV CORS_ALLOW_ORIGIN=http://localhost:3000
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=dashboard
ENV DB_NAME=dashboard
ENV SENTRY_DSN=
ENV SENTRY_ENVIRONMENT=production
ENV KEYCLOAK_REALM=CX-Central
ENV KEYCLOAK_CLIENT_RESOURCE=Cl9-CDQ-Fraud
ENV KEYCLOAK_CLIENT_ROLE=fraud_app_user
ENV KEYCLOAK_AUTH_URL=https://catenaxintakssrv.germanywestcentral.cloudapp.azure.com/iamcentralidp/auth/realms/CX-Central/protocol/openid-connect/auth"

WORKDIR /home/node/catenax-api
COPY --chown=node:node --from=cleaner /home/node/catenax-api ./
COPY --chown=node:node --from=builder /home/node/catenax-api/src/database/migrations ./src/database/migrations/

EXPOSE $API_PORT

USER node

HEALTHCHECK --interval=5m --timeout=10s CMD ["node", "./dist/healthcheck.js"]

CMD ["node", "-r", "source-map-support/register", "./dist/runserver.js"]

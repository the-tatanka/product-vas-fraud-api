import express, { Application } from 'express';
import cors from 'cors';
import * as Log from './log';
import keycloak from './keycloak'
import * as SentryHelper from './sentryHelper';
import * as Err from './errors';
import cfg from './configuration';
import publicRouter from './routes/public';
import fraudTypesRouter from './routes/fraudTypesRouter';
import fraudGeoRouter from './routes/fraudGeoRouter';
import cdqCasesRouter from './routes/cdqCasesRouter';
import cdqStatisticsRouter from './routes/cdqStatisticsRouter';
import workerRouter from './routes/workerRouter';

// Server setup:
const server: Application = express();
SentryHelper.init(server);

// Middlewares:
server.use(SentryHelper.requestMiddleware());
server.use(Log.middleware);
server.use(cors({credentials: true, origin: cfg.CORS_ALLOW_ORIGIN, methods: 'GET,HEAD,OPTIONS'}));
server.use(keycloak.middleware());

// Routes
server.use('/public', publicRouter);
server.use('/fraudcases/statistics', workerRouter);
server.use('/fraudcases', keycloak.protect(cfg.KEYCLOAK_CLIENT_ROLE))
server.use('/fraudcases/statistics/fraudtypes', fraudTypesRouter);
server.use('/fraudcases/statistics/geo', fraudGeoRouter);
server.use('/fraudcases/statistics', cdqStatisticsRouter);
server.use('/fraudcases', cdqCasesRouter);

// 404
server.use(Err.notFoundHandler);

// Error handlers
server.use(Err.defaultErrorHandler);
server.use(SentryHelper.errorMiddleware());

/**
 * @openapi
 * tags:
 * - name: Public
 *   description: "Publicly available endpoints for healthchecks and api documentation."
 * - name: Dashboard
 *   description: "Endpoints used by the dashboard frontend."
 * - name: Worker
 *   description: "Endpoints used by workers to update data from CDQ API and other tasks."
 * - name: Default
 *   description: "General endpoints."
 * components:
 *   securitySchemes:
 *     apiKeyAuth:
 *       description: API Key token to be used in **Worker** endpoints.
 *       type: apiKey
 *       in: header
 *       name: X-API-KEY
 *     bearerAuth:
 *       type: http
 *       description: A bearer access token as supplied by keycloak, to be used in **Dashboard** endpoints.
 *       name: Authorization
 *       in: header
 *       scheme: Bearer
 *       bearerFormat: JWT
 */
export default server;

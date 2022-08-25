import { Application, Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import Transport from 'winston-transport'
import { LogEntry } from 'winston'
import { includes, get, isNumber, isObject, isString, set } from 'lodash';
import { Breadcrumb } from '@sentry/types';
import cfg from './configuration';

function init(app: Application) {
	if (cfg.SENTRY_DSN) {
		const sentryOptions = {
			dsn: cfg.SENTRY_DSN,
			environment: cfg.SENTRY_ENVIRONMENT,
			release: `${cfg.PROJECT}@${cfg.VERSION}`,
			integrations: [
				// enable HTTP calls tracing
				new Sentry.Integrations.Http({ tracing: true }),
				// enable Express.js middleware tracing
				new Tracing.Integrations.Express({ app }),
			],
			// Set tracesSampleRate to 1.0 to capture 100%
			tracesSampleRate: 1.0,
		}
		Sentry.init(sentryOptions);
	} else {
		Sentry.init({dsn: ''});
	}
}

class SentryTransport extends Transport {
	constructor(opts?: Transport.TransportStreamOptions) {
		super(opts);
	}

	getSentryLevel(name: string): Sentry.Severity {
		switch(name) {
			case 'silly':
				return Sentry.Severity.Debug;
			case 'debug':
				return Sentry.Severity.Debug;
			case 'info':
				return Sentry.Severity.Info;
			case 'warn':
				return Sentry.Severity.Warning;
			case 'error':
				return Sentry.Severity.Error;
			case 'fatal':
				return Sentry.Severity.Fatal;
			default:
				return Sentry.Severity.Debug;
		}
	}

	log(entry: LogEntry, next: () => void): any {
		const crumb: Breadcrumb = {
		 	message: entry.message,
		 	level: this.getSentryLevel(entry.level),
		};
		if (isString(get(entry, 'type')))
			set(crumb, 'type', get(entry, 'type'));
		if (isString(get(entry, 'category')))
			set(crumb, 'category', get(entry, 'category'));
		if (isObject(get(entry, 'data')))
			set(crumb, 'data', get(entry, 'data'));
		if (isNumber(get(entry, 'timestamp')))
			set(crumb, 'timestamp', get(entry, 'timestamp'));
		Sentry.addBreadcrumb(crumb);
		if (includes(['error', 'fatal'], entry.level)) {
			Sentry.captureMessage(entry.message, Sentry.Severity.Error);
		}
		next();
	}
}

function requestMiddleware() {
	if (cfg.SENTRY_DSN) {
		// RequestHandler creates a separate execution context using domains, so that every
		// transaction/span/breadcrumb is attached to its own Hub instance
		return Sentry.Handlers.requestHandler();
	} else {
		return (_req: Request, _res: Response, next: NextFunction) => next();
	}
}

function tracingMiddleware() {
	if (cfg.SENTRY_DSN) {
		// TracingHandler creates a trace for every incoming request
		return Sentry.Handlers.tracingHandler();
	} else {
		return (_req: Request, _res: Response, next: NextFunction) => next();
	}
}

function errorMiddleware() {
	if (cfg.SENTRY_DSN) {
		// Default sentry error handler.
		return Sentry.Handlers.errorHandler();
	} else {
        return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
	}
}

export {
	init,
	requestMiddleware,
	tracingMiddleware,
	errorMiddleware,
	SentryTransport,
}

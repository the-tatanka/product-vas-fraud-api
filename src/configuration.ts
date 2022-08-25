import {name, version} from '../package.json';
import log from './log';

interface Configuration {
	readonly PROJECT: string,
	readonly VERSION: string,
	readonly API_PORT: number,
	readonly CORS_ALLOW_ORIGIN: string,
	readonly SENTRY_DSN: string,
	readonly SENTRY_ENVIRONMENT: string,
	readonly DB_HOST: string,
	readonly DB_PORT: number,
	readonly DB_USER: string,
	readonly DB_PASSWORD: string,
	readonly DB_NAME: string,
	readonly KEYCLOAK_REALM: string,
	readonly KEYCLOAK_CLIENT_RESOURCE: string,
	readonly KEYCLOAK_CLIENT_ROLE: string,
	readonly KEYCLOAK_AUTH_URL: string,
	readonly CDQ_API_KEY: string,
	readonly WORKER_API_KEY: string,
}

function parseIntOrDefault(source: string | undefined, otherwise: number): number {
	if (source) {
		return parseInt(source, 10) || otherwise;
	}
	return otherwise;
}

const configuration: Configuration = Object.freeze({
	PROJECT: name,
	VERSION: version,
	API_PORT: parseIntOrDefault(process.env.API_PORT, 8080),
	CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN || 'http://localhost:3000',
	SENTRY_DSN: process.env.SENTRY_DSN || '',
	SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || 'development',
	DB_HOST: process.env.DB_HOST || 'localhost',
	DB_PORT: parseIntOrDefault(process.env.DB_PORT, 5432),
	DB_USER: process.env.DB_USER || 'dashboard',
	DB_PASSWORD: process.env.DB_PASSWORD || 'supersecretpassword',
	DB_NAME: process.env.DB_NAME || 'dashboard',
	KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'catenax',
	KEYCLOAK_CLIENT_RESOURCE: process.env.KEYCLOAK_CLIENT_RESOURCE || 'catenax-api',
	KEYCLOAK_CLIENT_ROLE: process.env.KEYCLOAK_CLIENT_ROLE || 'user',
	KEYCLOAK_AUTH_URL: process.env.KEYCLOAK_AUTH_URL || 'http://localhost:8180/auth',
	CDQ_API_KEY: process.env.CDQ_API_KEY || 'CDQ_API_KEY_IS_NOT_SET',
	WORKER_API_KEY: process.env.WORKER_API_KEY || 'MjRjZDg4ZDItMTYxYS00NzA0LWE5YTgtMGI1MzRkZDVjNzUxOlRGMm16NnRNY2hjZzIyekpRYXhT',
});

function logConfiguration() {
	let property: keyof typeof configuration;
	/* eslint-disable-next-line guard-for-in */
	for (property in configuration) {
		let value = configuration[property];
		if(['_KEY', 'PASSWORD'].some(v => property.includes(v))) {
			value = '#######';
		}
		log.info(`${property}: ${value}`);
	}
}

export default configuration;
export {
	logConfiguration,
}

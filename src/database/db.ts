import createConnectionPool, { sql, ConnectionPoolConfig, SQLQuery } from '@databases/pg';
import { applyMigrations, Parameters } from '@databases/pg-migrations';
import { get } from 'lodash';
import middleware from './middleware';
import cfg from '../configuration';
import log from '../log';

const startTimes = new Map<SQLQuery, number>();
let connectionCount = 0;

const connectionPoolCfg : ConnectionPoolConfig = {
	bigIntMode: 'number',
	user: cfg.DB_USER,
	password: cfg.DB_PASSWORD,
	host: cfg.DB_HOST,
	database: cfg.DB_NAME,
	port: cfg.DB_PORT,
	poolSize: 4,
	onQueryStart: (query, {text, values}) => {
		log.debug(`START QUERY '${text}' - ${JSON.stringify(values)}`);
		startTimes.set(query, Date.now());
	},
	onQueryResults: (query, {text}, results) => {
		const start = startTimes.get(query);
		let duration: string;
		if (start) {
			duration = `${Date.now() - start}`;
		} else {
			duration = "unknown duration";
		}
		startTimes.delete(query);
		log.debug(`END QUERY   '${text}' | ${results.length} results | ${duration} ms`);
	},
	onQueryError: (query, {text}, err) => {
		startTimes.delete(query);
		log.error(`ERROR QUERY '${text}' : ${err.message}`);
	},
	onConnectionOpened: () => {
		++connectionCount;
		log.debug(`Opened connection. Active connections = ${connectionCount}`);
	},
	onConnectionClosed: () => {
		--connectionCount;
		log.debug(`Closed connection. Active connections = ${connectionCount}`);
	},
};

const pool = createConnectionPool(connectionPoolCfg);
const state = {
	connected: false,
	ready: false,
}

function isConnected():boolean {
	return state.connected;
}

function isReady():boolean {
	return state.ready;
}

async function checkConnection(): Promise<void> {
	const wasReady = isReady();
	state.connected = state.ready = false;
	const results = await pool.query(sql`SELECT true as connected;`);
	const result = get(results, '[0].connected', false) as boolean;
	state.connected = result;
	state.ready = wasReady && result;
}

async function checkMigrations(): Promise<void> {
	const params: Parameters = {
		connection:  pool,
		migrationsDirectory : "./src/database/migrations"
	}
	state.ready = false;
	await applyMigrations(params);
	state.ready = true;
}

async function shutdown() {
	try {
		await pool.dispose()
		state.connected = false;
		state.ready = false;
		log.info(`Database connection pool shut down`)
	} catch (err) {
		log.error('Failed to shut down database connection pool:', err)
	}
}

export {
	pool,
	sql,
	isConnected,
	isReady,
	checkConnection,
	checkMigrations,
	shutdown,
	middleware,
};

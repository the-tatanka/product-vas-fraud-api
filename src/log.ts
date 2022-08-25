import winston, { createLogger, transports, format } from 'winston'
import morgan, { StreamOptions } from 'morgan'
import { trimEnd } from 'lodash';
import { SentryTransport } from './sentryHelper';

const apiLogFormat: (info: winston.Logform.TransformableInfo) => string =
	(info) => `${info.timestamp as string} ${info.level}: ${info.message}`;

const log = createLogger({
	level: 'debug',
	transports: [
		new transports.Console({
			level: 'debug',
			format: winston.format.combine(
				format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
				format.colorize(),
				format.printf(apiLogFormat),
			),
		}),
		new SentryTransport({
			level: 'debug',
			format: winston.format.combine(
				format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
				format.printf(apiLogFormat),
			),
		}),
	],
});

// use winston as morgan express middleware:
const stream: StreamOptions = {
	write: (message) => log.info(trimEnd(message)),
};
const middleware = morgan(
	":method :url | :status | :res[content-length] bytes | :response-time ms",
	{ stream }
);

export default log;
export {
	middleware,
};

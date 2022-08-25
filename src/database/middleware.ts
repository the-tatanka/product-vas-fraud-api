import { Request, Response, NextFunction, RequestHandler } from 'express';
import OperationalError from '../errors';
import * as db from './db';

const middleware = (async (_req: Request, _res: Response, next: NextFunction) => {
	try {
		try {
			await db.checkConnection();
		} catch (err) {
			throw new OperationalError(503, "cannot establish database connection", err);
		}
		if (!db.isReady()) { // we don't want to check migrations on every call.
			try {
				await db.checkMigrations();
			} catch (err) {
				throw new OperationalError(503, "cannot ensure database migrations", err);
			}
		}
		next();
	} catch (err) {
		next(err);
	}
}) as RequestHandler

export default middleware;

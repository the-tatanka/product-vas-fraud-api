import { Request, Response, NextFunction } from 'express';
import { get, isNumber, isString, set } from 'lodash';
import log from './log';

/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       properties:
 *         statusCode:
 *           type: integer
 *           format: int32
 *           minimum: 100,
 *           maximum: 500
 *         message:
 *           type: string
 *   responses:
 *     BadRequest:
 *       description: The request is invalid.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 400
 *             message: malformed query parameter 'earliest', must be YYYY-MM-DD
 *     Unauthorized:
 *       description: Authorization is required but has not been provided.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 401
 *             message: access denied
 *     Forbidden:
 *       description: The authorization provided is insufficient for this request.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 403
 *             message: request denied
 *     Busy:
 *       description: The api is busy handling requests, please try again later
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 429
 *             message: too many requests
 *     ServerFault:
 *       description: The server has encountered an unexpected failure
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 500
 *             message: unknown error
 *     ServiceUnavailable:
 *       description: The endpoint is currently not available
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             statusCode: 503
 *             message: cannot establish database connection
 */


class OperationalError extends Error {
	name: string;
	statusCode: number;

	constructor(code:number, msg:string, err?: any) {
		super(msg || '');
		this.name = this.constructor.name
		this.statusCode = code || 500;
		if (err) {
			if (typeof err === 'string') {
				this.message = this.message.concat(`: ${err}`);
			}
			if (err instanceof Error) {
				if (err.stack) {
					const message_lines = (this.message.match(/\n/g) || []).length + 1;
					if (this.stack) {
						this.stack = `${this.stack
								.split("\n")
								.slice(0, message_lines + 1)
								.join("\n")}\n${err.stack}`;
					} else {
						this.stack = err.stack;
					}
				} else {
					this.message = this.message.concat(`: ${err.message} (${err.name})`);
				}
			}
		}
	}

	toString() {
		return `${this.message} (${this.statusCode})`;
	}

	toJson() {
		const obj = {
			code: this.statusCode,
			error: this.message
		};
		return JSON.stringify(obj);
	}
}

function notFoundHandler(req: Request, res: Response, next: NextFunction) {
	const code = 404;
	const response = {
		statusCode: code,
		message: `Path '${req.url}' does not exist`,
	}
	res.setHeader('Content-Type', 'application/json');
	res.status(code).send(JSON.stringify(response));
	next();
}

function defaultErrorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
	if (res.headersSent) {
		log.error("Response sent before error handler, do not do this!");
		next(err);
	} else {
		let code: number;
		if (err instanceof OperationalError) {
			code = err.statusCode;
		} else if (isNumber(get(err,'statusCode'))) {
			code = get(err, 'statusCode') as number;
		} else {
			code = 500;
		}
		const message = err.message || "unexpected error";
		const response = {
			statusCode: code,
			message,
		}
		if (isString(get(err, 'error'))) {
			set(response, 'error', get(err, 'error'));
		}
		log.error(`${code}: ${message}`);
		res.setHeader('Content-Type', 'application/json');
		res.status(code).send(JSON.stringify(response));
	}
	next(err);
}

function extractErrorMessage(err: any): string {
	if (typeof err === 'string') {
		return err;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return "";
}

export default OperationalError
export {
	notFoundHandler,
	defaultErrorHandler,
	extractErrorMessage
}

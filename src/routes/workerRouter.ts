import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import { get, toString } from 'lodash';
import * as db from '../database/db';
import { upsertFraudevents, validateFraudevent } from '../database/fraudevents';
import OperationalError from '../errors';
import log from '../log';
import cfg from '../configuration';
import {FraudeventsInsert} from '../database/types';

const router = express.Router();
const jsonBody = bodyParser.json();

/**
 * @openapi
 * /fraudcases/statistics:
 *   put:
 *     description: Insert or update fraud case events. This endpoint handles the request *synchronously*. The api keeps track on when fraud case events have been updated.
 *     tags:
 *     - Worker
 *     security:
 *     - apiKeyAuth: []
 *     operationId: putStatistics
 *     requestBody:
 *       description: A list of simplified fraud case events for statistical evaluation.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 cdlId:
 *                   type: string
 *                   minLength: 10
 *                   maxLength: 10
 *                 dateOfAttack:
 *                   type: number
 *                   format: int64
 *                   minimum: 0
 *                 type:
 *                   type: string
 *                   enum:
 *                   - "ACTIVE_WARNING"
 *                   - "ANNOUNCEMENT"
 *                   - "FAKE_DOCUMENT"
 *                   - "FAKE_EMAIL"
 *                   - "FAKE_PRESIDENT_CALL"
 *                   - "FALSIFIED_INVOICE"
 *                 countryCode:
 *                   type: string
 *                   pattern: ^[A-Z]{2}$
 *               required:
 *               - cdlId
 *               - dateOfAttack
 *               - type
 *               - countryCode
 *           example:
 *           - cdlId: FQdqB4fDL4
 *             dateOfAttack: 1485908200000
 *             type: FALSIFIED_INVOICE
 *             countryCode: DE
 *           - cdlId: zbSSUNiDzG
 *             dateOfAttack: 1488327600000
 *             type: ANNOUNCEMENT
 *             countryCode: IT
 *     responses:
 *       200:
 *         description: The fraud cases specified in the request's body are updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   format: int64
 *                   description: number of entries inserted / updated.
 *                 updatedAt:
 *                   type: string
 *                   format: date
 *                   description: the timestamp (with timezone) of when the fraud cases have been inserted / updated. Use this value for the delete operation on the same path.
 *                   example: "2022-12-31T16:23:10.000+00"
 *             example:
 *               updated: 500
 *               updatedAt: "2022-12-31T16:23:10.000+00"
 *         links:
 *           deleteUserByLatest:
 *             operationId: deleteStatistics
 *             parameters:
 *               latest: '$response.body#/updatedAt'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/Busy'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
router.put('/', apiKeyAuth, db.middleware, jsonBody, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = validatePutRequest(req);
		if (parsed.error) {
			const msg = parsed.error.details.map(x => x.message).join(', ');
			next(new OperationalError(400, `Validation errors: ${msg}`));
		} else {
			const tz = await db.pool.query(db.sql`SELECT NOW()::TIMESTAMPTZ AS timestamptz;`);
			log.silly(`put:\n${JSON.stringify(parsed.value, null, 2)}`);
			const inserted = await upsertFraudevents(parsed.value);
			log.silly(`inserted:\n${JSON.stringify(inserted, null, 2)}`);
			res.setHeader('Content-Type', 'application/json');
			const response = {
				updated: inserted.length,
				updatedAt: get(tz,'[0].timestamptz') as string,
			};
			res.status(200).send(JSON.stringify(response));
		}
	} catch (err) {
		next(err);
	}
});

function validatePutRequest(req: Request): Joi.ValidationResult<FraudeventsInsert[]> {
	const schema = Joi.array().items(
		Joi.object().custom(validateFraudevent, 'put item'),
	);
	const options = {
		abortEarly: false,
		allowUnknown: false,
	};
	return schema.validate(req.body, options);
}

/**
 * @openapi
 * /fraudcases/statistics:
 *   delete:
 *     description: Remove stale entries which haven't been updated since `latest`. The request will be handled *asynchronously*.
 *     tags:
 *     - Worker
 *     security:
 *     - apiKeyAuth: []
 *     operationId: deleteStatistics
 *     parameters:
 *     - in: query
 *       name: latest
 *       description: Instruct api to delete all entries not updated since `latest`. If `latest` isn't set then all statistics are purged. You should use the value of `updatedAt` from the first **put**-response you requested on the same path.
 *       schema:
 *         type: string
 *         format: date
 *         example: "2022-12-31T16:23:10.000+00"
 *     responses:
 *       204:
 *         description: The api will now delete all entries not updated since `latest` and update all fraud case statistics. Call this endpoint only after all **put**-requests have been successfully called.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/Busy'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
router.delete('/', apiKeyAuth, db.middleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = validateDeleteRequest(req);
		if (parsed.error) {
			const msg = parsed.error.details.map(x => x.message).join(', ');
			next(new OperationalError(400, `Validation errors: ${msg}`));
		} else {
			res.sendStatus(204);
			await db.pool.query(db.sql`DELETE FROM "fraudevents" WHERE "updated_at" < ${parsed.value.latest};`);
			await db.pool.query(db.sql`REFRESH MATERIALIZED VIEW "dailyevents";`);
			await db.pool.query(db.sql`REFRESH MATERIALIZED VIEW "dailysummaries";`);
		}
	} catch (err) {
		next(err);
	}
});

interface DeleteRequestQueryParam {
	latest: string,
}

function validateDeleteRequest(req: Request): Joi.ValidationResult<DeleteRequestQueryParam> {
	const schema = Joi.object({
		latest: Joi.string().required().isoDate(),
	});
	const options = {
		abortEarly: false,
		allowUnknown: false,
	};
	return schema.validate(req.query, options);
}

function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
	const workerApiKey:string = toString(get(req, 'headers.x-api-key'));
	if (!workerApiKey) {
		throw new OperationalError(401, "no API authorization provided (X-API-KEY)");
	} else if (workerApiKey !== cfg.WORKER_API_KEY) {
		throw new OperationalError(403, "authorization insufficient for this request");
	}
	next();
}

export default router;

import express, { Request, RequestHandler, Response, NextFunction } from 'express';
import moment from 'moment';
import Joi from 'joi';
import { get, has, split, pick } from 'lodash';
import OperationalError from '../errors';
import * as db from '../database/db';

const router = express.Router();

/**
 * @openapi
 * /fraudcases/statistics/fraudtypes:
 *   get:
 *     description: Returns information on a specific fraud case.
 *     tags:
 *     - Dashboard
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: earliest
 *       description: The statistics shown in the result will only include fraud cases that happened *after* the specified date (with `dateOfAttack >= earliest`).
 *       schema:
 *         type: string
 *         format: date
 *         example: "2019-01-31"
 *     - in: query
 *       name: latest
 *       description: The statistics shown in the result will only include fraud cases that happened *before* the specified date (with `dateOfAttack <= latest`).
 *       schema:
 *         type: string
 *         format: date
 *         example: "2022-12-31"
 *     - in: query
 *       name: fraudtypes
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *           enum:
 *             - "active_warning"
 *             - "announcement"
 *             - "fake_document"
 *             - "fake_email"
 *             - "fake_president_call"
 *             - "falsified_invoice"
 *       style: form
 *       explode: false
 *       examples:
 *         oneFraudType:
 *           summary: Example of selecting a single fraud type.
 *           value: ["fake_document"]
 *         multipleFraudTypes:
 *           summary: Example of selecting multiple fraud types.
 *           value: ["fake_document","fake_email","fake_president_call"]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FraudCaseStatistic'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 * components:
 *   responses:
 *     FraudCaseStatistic:
 *       description: Overall fraud case statistics.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FraudCaseStatistic'
 */
router.get('/', db.middleware, (async (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = parseRequest(req);
		if (parsed.error) {
			throw new OperationalError(400, parsed.error.message);
		} else {
			let earliest = 0;
			let latest = 31556995200000;
			if (parsed.value && parsed.value.earliest) {
				earliest = parsed.value.earliest.valueOf();
			}
			if (parsed.value && parsed.value.latest) {
				latest = parsed.value.latest.valueOf();
			}
			const dailysummariesSum = await db.pool.query(db.sql`select dailysummaries_between(${earliest}, ${latest})`);
			const result = get(dailysummariesSum,'[0].dailysummaries_between','(0,0,0,0,0,0)') as string;
			const values = split(result.slice(1,-1),',');
			const response = {
				active_warning : parseInt(values[0], 10) || 0,
				announcement : parseInt(values[1], 10) || 0,
				fake_document : parseInt(values[2], 10) || 0,
				fake_email : parseInt(values[3], 10) || 0,
				fake_president_call : parseInt(values[4], 10) || 0,
				falsified_invoice : parseInt(values[5], 10) || 0,
			};
			res.setHeader('Content-Type', 'application/json');
			if (has(parsed, 'value.fraudtypes')) {
				res.send(JSON.stringify(pick(response, split(parsed.value.fraudtypes, ','))));
			} else {
				res.send(JSON.stringify(response));
			}
		}
	} catch (err) {
		next(err);
	}
}) as RequestHandler);

function validateDate(value: string): moment.Moment | Joi.ErrorReport {
	const result = moment(value, 'YYYY-MM-DD');
	if (!result.isValid()) {
		throw new Error('it is invalid or not conforming to YYYY-MM-DD');
	}
	return result;
}

interface FraudTypesQueryParams {
	earliest? : moment.Moment,
	latest? : moment.Moment,
	fraudtypes? : string,
}

function parseRequest(req: Request): Joi.ValidationResult<FraudTypesQueryParams> {
	const params = Joi.object({
		earliest: Joi.string().custom(validateDate, 'YYYY-MM-DD'),
		latest: Joi.string().custom(validateDate, 'YYYY-MM-DD'),
		fraudtypes: Joi.string(),
	});
	const queryParams: Joi.ValidationResult<FraudTypesQueryParams> = params.validate(req.query, {dateFormat: 'utc'});
	if (!queryParams.error && queryParams.value && queryParams.value.latest) {
		queryParams.value.latest = queryParams.value.latest.add(1, 'days').subtract(1, 'milliseconds');
	}
	return queryParams;
}

export default router;

import express, { Request, RequestHandler, Response, NextFunction } from 'express';
import moment from 'moment';
import Joi from 'joi';
import { split, upperCase, lowerCase } from 'lodash';
import OperationalError from '../errors';
import * as db from '../database/db';

const router = express.Router();


/**
 * @openapi
 * /fraudcases/statistics/geo:
 *   get:
 *     description: Returns information on fraud cases per country.
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
 *       name: countries
 *       description: Country codes as per iso-3166-1 alpha 2 (lowercase or uppercase).
 *       schema:
 *         type: array
 *         items:
 *           type: string
 *       style: form
 *       explode: false
 *       examples:
 *         oneCountry:
 *           summary: Example of selecting a single country.
 *           value: ["de"]
 *         multipleCountries:
 *           summary: Example of selecting multiple countries.
 *           value: ["de","fr","uk"]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FraudCaseGeo'
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
 *     FraudCaseGeo:
 *       description: Overall fraud case statistics by country.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FraudCaseGeo'
 */

router.get('/', db.middleware, (async (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = parseRequest(req);
		if (parsed.error) {
			throw new OperationalError(400, parsed.error.message);
		} else {
			let earliest = 0;
			let latest = 31556995200000;
			let countries = '';
			if (parsed.value && parsed.value.countries) {
				countries = split(parsed.value.countries,',').map(upperCase).join(',');
			}
			if (parsed.value && parsed.value.earliest) {
				earliest = parsed.value.earliest.valueOf();
			}
			if (parsed.value && parsed.value.latest) {
				latest = parsed.value.latest.valueOf();
			}
			const dailyeventSum = await db.pool.query(db.sql`select dailyevents_between(${earliest}, ${latest}, ${countries})`) as DailyeventsBetween[];
			let response: FraudGeoResponse = {};
			response = dailyeventSum.reduce((acc: FraudGeoResponse, cur) => {
				const values = split(cur.dailyevents_between.slice(1,-1),',');
				const country = lowerCase(values[0]);
				if (country !== 'xx') {
					acc[country] = {
						active_warning : parseInt(values[1], 10) || 0,
						announcement : parseInt(values[2], 10) || 0,
						fake_document : parseInt(values[3], 10) || 0,
						fake_email : parseInt(values[4], 10) || 0,
						fake_president_call : parseInt(values[5], 10) || 0,
						falsified_invoice : parseInt(values[6], 10) || 0,
					}
				}
				return acc;
			}, response);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(response));
		}
	} catch (err) {
		next(err);
	}
}) as RequestHandler);

function validateDate(value: string) : moment.Moment | Joi.ErrorReport {
	const result = moment(value, 'YYYY-MM-DD');
	if (!result.isValid()) {
		throw new Error('it is invalid or not conforming to YYYY-MM-DD');
	}
	return result;
}

interface DailyeventsBetween {
	dailyevents_between: string
}

interface FraudGeoResponse {
	[key: string]: {
		active_warning: number,
		announcement: number,
		fake_document: number,
		fake_email: number,
		fake_president_call: number,
		falsified_invoice: number,
	}
}

interface FraudGeoQueryParams {
	earliest? : moment.Moment,
	latest? : moment.Moment,
	countries? : string,
}

function parseRequest(req: Request): Joi.ValidationResult<FraudGeoQueryParams> {
	const params = Joi.object({
		earliest: Joi.string().custom(validateDate, 'YYYY-MM-DD'),
		latest: Joi.string().custom(validateDate, 'YYYY-MM-DD'),
		countries: Joi.string().pattern(/^(?:[a-z]{2})(?:,[a-z]{2})*$/),
	});
	const queryParams: Joi.ValidationResult<FraudGeoQueryParams> = params.validate(req.query, {dateFormat: 'utc'});
	if (!queryParams.error && queryParams.value && queryParams.value.latest) {
		queryParams.value.latest = queryParams.value.latest.add(1, 'days').subtract(1, 'milliseconds');
	}
	return queryParams;
}

export default router;

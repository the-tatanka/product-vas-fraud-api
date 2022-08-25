import bodyParser from 'body-parser';
import express, { Request, Response, NextFunction } from 'express';
import { createFraudCase, getFraudcases } from './cdqApi';

const router = express.Router();

/**
 * @openapi
 * /fraudcases:
 *   get:
 *     description: Returns cdq fraud cases as queried.
 *     url: https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage
 *     tags:
 *     - Dashboard
 *     security:
 *     - bearerAuth: []
 *     externalDocs:
 *       description: The CDQ Fraud Cases API specification.
 *       url: https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage
 *     parameters:
 *     - in: query
 *       name: page
 *       description: CDQ API - the page index. The index of the first page is 0.
 *       schema:
 *         type: number
 *         default: 0
 *         example: 0
 *     - in: query
 *       name: pageSize
 *       description: CDQ API - number of records listed on one page.
 *       schema:
 *         type: number
 *         default: 200
 *         example: 10
 *     - in: query
 *       name: search
 *       description: CDQ API - the phrase that the query will look for.
 *       schema:
 *         type: string
 *     - in: query
 *       name: sort
 *       description: CDQ API - defines the attributes to sort by. A '-' reverses sort order.
 *       schema:
 *         type: string
 *         default: "creationTimestamp"
 *         example: "-dateOfAttack"
 *     responses:
 *       200:
 *         description: See [CDQ API GET /fraudcases](https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage).
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 */
/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
	getFraudcases(req.query)
		.then(cdqApiResponse => {
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).send(cdqApiResponse.json);
		})
		.catch(next);
});

/**
 * @openapi
 * /fraudcases:
 *   post:
 *     description: Create CATENAX fraud case.
 *     url: https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage
 *     tags:
 *     - Dashboard
 *     security:
 *     - bearerAuth: []
 *     externalDocs:
 *       description: The CDQ Fraud Cases API specification.
 *       url: https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage
 *     parameters:
 *     - in: query
 *       name: page
 *       description: CDQ API - the page index. The index of the first page is 0.
 *       schema:
 *         type: object
 *         properties:
 *           value:
 *             type: string
 *           type:
 *             type: string
 *     responses:
 *       200:
 *         description: See [CDQ API GET /fraudcases](https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasePage).
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 */
router.post('/', bodyParser.json(), (req: Request, res: Response, next: NextFunction) => {
	// eslint-disable-next-line no-console
	createFraudCase(req.body).then(cdqResponse => {
		res.setHeader('Content-Type', 'application/json');
		return res.status(201).send(cdqResponse.json)
	}).catch(next)
})

export default router;

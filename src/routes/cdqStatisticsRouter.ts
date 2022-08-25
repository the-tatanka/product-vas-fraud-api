import express, { Request, Response, NextFunction } from 'express';
import { getStatistics } from './cdqApi';

const router = express.Router();

/**
 * @openapi
 * /fraudcases/statistics:
 *   get:
 *     description: Returns cdq fraud case statistics.
 *     tags:
 *     - Dashboard
 *     security:
 *     - bearerAuth: []
 *     externalDocs:
 *       description: The CDQ Fraud Cases API specification.
 *       url: https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasesStatistics
 *     responses:
 *       200:
 *         description: Statistics about the fraud cases via the CDQ API. See [CDQ API GET /fraudcases/statistics](https://developer.cdq.com/reference-docs/bankaccount-data/V2/tag/Fraud-Cases/#tag/Fraud-Cases/operation/readFraudCasesStatistics).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CDQFraudCaseStatistic'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerFault'
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
	getStatistics()
		.then(cdqApiResponse => {
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).send(cdqApiResponse.json);
		})
		.catch(next);
});

export default router;

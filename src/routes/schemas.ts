/**
 * @openapi
 * components:
 *   schemas:
 *     FraudCaseStatistic:
 *       type: object
 *       description: fraud case statistics by type.
 *       properties:
 *         active_warning:
 *           type: integer
 *           format: int64
 *         announcement:
 *           type: integer
 *           format: int64
 *         fake_document:
 *           type: integer
 *           format: int64
 *         fake_email:
 *           type: integer
 *           format: int64
 *         fake_president_call:
 *           type: integer
 *           format: int64
 *         falsified_invoice:
 *           type: integer
 *           format: int64
 *       example:
 *         active_warning: 16
 *         announcement: 17
 *         fake_document: 17
 *         fake_email: 19
 *         fake_president_call: 23
 *         falsified_invoice: 40
 *     CDQFraudCaseStatistic:
 *       type: object
 *       description: Statistics about the fraud cases via the CDQ API.
 *       properties:
 *         cachedValue:
 *           type: boolean
 *         date:
 *           type: integer
 *           format: int64
 *         numberOfAllFraudCases:
 *           type: integer
 *           format: int64
 *         numberOfDisclosedFraudCases:
 *           type: integer
 *           format: int64
 *         numberOfDisclosedFraudCasesOfTheUsersOrganization:
 *           type: integer
 *           format: int64
 *         numberOfFraudCasesOfTheUsersOrganization:
 *           type: integer
 *           format: int64
 *         numberOfUndisclosedFraudCases:
 *           type: integer
 *           format: int64
 *         numberOfUndisclosedFraudCasesOfTheUsersOrganization:
 *           type: integer
 *           format: int64
 *       example:
 *         cachedValue: true
 *         date: 1648804091264
 *         numberOfAllFraudCases: 657
 *         numberOfDisclosedFraudCases: 288
 *         numberOfDisclosedFraudCasesOfTheUsersOrganization: 369
 *         numberOfFraudCasesOfTheUsersOrganization: 0
 *         numberOfUndisclosedFraudCases: 0
 *         numberOfUndisclosedFraudCasesOfTheUsersOrganization: 0
 *     FraudCaseGeo:
 *       type: object
 *       properties:
 *         de:
 *           $ref: '#/components/schemas/FraudCaseStatistic'
 *         fr:
 *           $ref: '#/components/schemas/FraudCaseStatistic'
 *       example:
 *         de:
 *           active_warning: 3
 *           announcement: 2
 *           fake_document: 5
 *           fake_email: 10
 *           fake_president_call: 6
 *           falsified_invoice: 12
 *         fr:
 *           active_warning: 2
 *           announcement: 4
 *           fake_document: 8
 *           fake_email: 6
 *           fake_president_call: 7
 *           falsified_invoice: 18
 */

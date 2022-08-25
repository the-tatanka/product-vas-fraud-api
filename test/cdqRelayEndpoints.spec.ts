import { describe, it, afterEach } from 'mocha';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import sinon from "sinon";
import nock from 'nock';
import cfg from '../src/configuration';

/* Disable keycloak authorization for this test suite */
import keycloak from '../src/keycloak';
sinon.stub(keycloak, 'protect').returns((_req, _res, next) => next());

/* Under test */
import server from '../src/server';

describe('Endpoints relayed to CDQ API', function() {
	let nockCDQ: nock.Scope;
	before(() => {
		nock.disableNetConnect();
		nock.enableNetConnect('127.0.0.1');
		nockCDQ = nock('https://api.cdq.com', {
			reqheaders: {
				"X-API-KEY": cfg.CDQ_API_KEY,
			}
		});
	});
	afterEach(function() {
		nock.abortPendingRequests();
		nock.cleanAll();
	});
	after(() => {
		nock.restore();
	});

	it('relays fraud cases from CDQ on /fraudcases', async function() {
		const mockResult = {
			page: 1,
			pageSize: 200,
			numberOfPages: 0,
			recordCount: 0,
			sortField: "creationTimestamp",
			ascending: true,
			fraudCases: []
		};
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases')
			.query({classification: "CATENAX"})
			.reply(200, mockResult);
		const res = await chai.request(server).get('/fraudcases');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal(mockResult);
	});

	it('relays all query parameters to CDQ on /fraudcases', async function() {
		const mockResult = {
			page: 1,
			pageSize: 200,
			numberOfPages: 0,
			recordCount: 0,
			sortField: "string",
			ascending: true,
			fraudCases: []
		};
		const queryParams = {
			page: 1,
			pageSize: 100,
			search: "searchparam",
			sort: "-dateOfAttack",
		};
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases')
			.query({
				classification: "CATENAX",
				...queryParams,
			})
			.reply(200, mockResult)
		const res = await chai.request(server).get('/fraudcases').query(queryParams);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal(mockResult);
		nockCDQ.done();
	});

	it('relays json error message from CDQ on /fraudcases', async function() {
		const cdqStatus = 503;
		const cdqError = "service unavailable";
		const cdqMsg = "fraudcase api down due to maintenance";
		const mockResult = {
			error: cdqError,
			message: cdqMsg,
			status: cdqStatus,
		};
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases')
			.query({classification: "CATENAX"})
			.reply(cdqStatus, mockResult);
		const res = await chai.request(server).get('/fraudcases');
		expect(res).to.have.status(cdqStatus);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			message: `CDQ API call failed (code: ${cdqStatus}): ${cdqError}, ${cdqMsg}`,
			statusCode: cdqStatus,
		});
		nockCDQ.done();
	});

	it('relays unparseable empty response CDQ on /fraudcases gracefully', async function() {
		const cdqStatus = 204;
		const expectedStatus = 503;
		const expectedMsg = `CDQ API call failed (code: ${cdqStatus}): received unparseable content: ''`;
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases')
			.query({classification: "CATENAX"})
			.reply(cdqStatus);
		const res = await chai.request(server).get('/fraudcases');
		expect(res).to.have.status(expectedStatus);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			message: expectedMsg,
			statusCode: expectedStatus,
		});
		nockCDQ.done();
	});

	it('relays unparseable (text) error messages from CDQ on /fraudcases gracefully', async function() {
		const cdqStatus = 500;
		const cdqMsg = "server error";
		const expectedStatus = 503;
		const expectedMsg = `CDQ API call failed (code: ${cdqStatus}): received unparseable content: '${cdqMsg}'`;
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases')
			.query({classification: "CATENAX"})
			.reply(cdqStatus, cdqMsg);
		const res = await chai.request(server).get('/fraudcases');
		expect(res).to.have.status(expectedStatus);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			message: expectedMsg,
			statusCode: expectedStatus,
		});
		nockCDQ.done();
	});

	it('relays fraud case statistics from CDQ on /fraudcases/statistics', async function() {
		const mockResult = {
			date: 0,
			cachedValue: true,
			numberOfAllFraudCases: 1,
			numberOfDisclosedFraudCases: 2,
			numberOfUndisclosedFraudCases: 3,
			numberOfFraudCasesOfTheUsersOrganization: 4,
			numberOfDisclosedFraudCasesOfTheUsersOrganization: 5,
			numberOfUndisclosedFraudCasesOfTheUsersOrganization: 6
		};
		nockCDQ
			.get('/bankaccount-data/rest/fraudcases/statistics')
			.reply(200, mockResult);
		const res = await chai.request(server).get('/fraudcases/statistics');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal(mockResult);
		nockCDQ.done();
	});
});

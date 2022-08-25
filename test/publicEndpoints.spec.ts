import { describe, it, afterEach } from 'mocha';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import sinon from "sinon";
import cfg from '../src/configuration';
import * as db from '../src/database/db';

/* Under test */
import server from '../src/server';

describe('Public api endpoints', function() {
	afterEach(() => {
		sinon.restore();
	});
	it('publishes the swagger.json openapi specification on /public/swagger.json', async function () {
		const res = await chai.request(server).get('/public/version');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
	});

	it('publishes swagger ui on /public/api-docs', async function() {
		const res = await chai.request(server).get('/public/api-docs');
		expect(res).to.have.status(200);
		expect(res).to.be.html;
	});

	it('signals being alive on /alive using code 204', async function() {
		const res = await chai.request(server).get('/public/alive');
		expect(res).to.have.status(204);
		expect(res.text).to.be.empty;
	});

	it('signals being ready on /ready using code 204 if db is connected', async function() {
		sinon.stub(db, 'checkMigrations').resolves();
		sinon.stub(db, 'checkConnection').resolves();
		sinon.stub(db, 'isConnected').returns(true);
		sinon.stub(db, 'isReady').returns(true);
		const res = await chai.request(server).get('/public/ready');
		expect(res).to.have.status(204);
		expect(res.text).to.be.empty;
	});

	it('signals being not ready on /ready using code 418 if db is not connected', async function() {
		sinon.stub(db, 'isConnected').returns(false);
		sinon.stub(db, 'checkConnection').throws(new Error());
		const res = await chai.request(server).get('/public/ready');
		expect(res).to.have.status(418);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			database: {
				connected: false,
				ready: false,
			}
		});
	});

	it('returns name and version as json object on /public/version', async function() {
		const res = await chai.request(server).get('/public/version');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.have.all.keys('name', 'version');
		expect(actual.name).to.equal(cfg.PROJECT);
		expect(actual.version).to.equal(cfg.VERSION);
	});

	it('redirects /public to /public/api-docs', async function() {
		const req = chai.request(server).get('/public');
		const originalReqURL = req.url;
		const res = await req;
		expect(res).to.redirect;
		expect(res).to.redirectTo(`${originalReqURL}/api-docs/`);
		expect(res).to.have.status(200);
		expect(res).to.be.html;
	});
});

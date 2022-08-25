import { describe, it, afterEach } from 'mocha';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import sinon from "sinon";
import moment from 'moment';
import _ from 'lodash';
import cfg from '../src/configuration';
import { Efraudtype } from '../src/database/types';
import * as fraudevents from '../src/database/fraudevents';
import * as db from '../src/database/db';

/* Under test */
import server from '../src/server';

describe('Worker api endpoints', () => {
	afterEach(() => {
		sinon.restore();
	})

	it('gracefully handles empty body on PUT /fraudcases/statistics', async function() {
		sinon.stub(db, 'checkConnection').resolves();
		sinon.stub(db, 'isReady').returns(true);
		const timestamp = moment().toISOString();
		sinon.stub(db.pool, 'query').resolves([{timestamptz: timestamp}] as any[]);
		const res = await chai.request(server)
		.put('/fraudcases/statistics')
		.set("X-API-KEY", cfg.WORKER_API_KEY)
		.send([]);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			updated: 0,
			updatedAt: timestamp,
		});
	});

	it('reports validation error on PUT /fraudcases/statistics if body is no json array', async function() {
		sinon.stub(db, 'checkConnection').resolves();
		sinon.stub(db, 'isReady').returns(true);
		const res = await chai.request(server)
		.put('/fraudcases/statistics')
		.set("X-API-KEY", cfg.WORKER_API_KEY)
		.send({});
		expect(res).to.have.status(400);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			message: "Validation errors: \"value\" must be an array",
      		statusCode: 400
		});
	});

	it('allows empty countryCode on PUT /fraudcases/statistics', async function() {
		sinon.stub(db, 'checkConnection').resolves();
		sinon.stub(db, 'isReady').returns(true);
		const timestampNow = moment().toISOString();
		const timestampDate = moment().toDate();
		const expectedArgsToUpsert = {
			cdl_id: "somecdlidx",
			attack_date: 1,
			country_code: 'XX',
			fraudtype: 'ACTIVE_WARNING' as Efraudtype,
		};
		sinon.stub(db.pool, 'query').resolves([{timestamptz: timestampNow}] as any[]);
		sinon.stub(fraudevents, 'upsertFraudevents').withArgs([expectedArgsToUpsert])
		.resolves([{
			id: 1,
			...expectedArgsToUpsert,
			created_at: timestampDate,
			updated_at: timestampDate,
		}]);
		const res = await chai.request(server)
		.put('/fraudcases/statistics')
		.set("X-API-KEY", cfg.WORKER_API_KEY)
		.send([{
			cdlId: expectedArgsToUpsert.cdl_id,
			dateOfAttack: expectedArgsToUpsert.attack_date,
			countryCode: null,
			type: expectedArgsToUpsert.fraudtype,
		}]);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		const actual = JSON.parse(res.text);
		expect(actual).to.deep.equal({
			updated: 1,
			updatedAt: timestampNow,
		});
	});
});

import { describe, it} from 'mocha';
import { expect } from 'chai';
import cfg from '../src/configuration';

describe('Configuration', () => {
	it('has default values for each element', () => {
    	let property: keyof typeof cfg;
    	for (property in cfg) {
			expect(cfg[property], property).to.not.be.null;
			if (typeof cfg[property] == 'number') {
				expect(cfg[property], property).to.be.finite;
				expect(cfg[property], property).to.be.at.least(0);
			}
    	}
	});
	it('is immutable', () => {
		expect(cfg).to.be.frozen;
	});
});

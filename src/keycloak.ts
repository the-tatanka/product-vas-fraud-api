import { Request, Response } from 'express';
import Keycloak, { KeycloakConfig } from 'keycloak-connect';
import cfg from './configuration';

const keycloakCfg:KeycloakConfig = {
	realm: cfg.KEYCLOAK_REALM,
	'bearer-only': true,
	'auth-server-url': cfg.KEYCLOAK_AUTH_URL,
	'ssl-required': "external",
	'resource': cfg.KEYCLOAK_CLIENT_RESOURCE,
	'confidential-port': 0,
};

function init() {
	/* keycloak-connect's accessDenied handling erroneously ends the response,
	 * we need to patch that here: */
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
	Keycloak.prototype.accessDenied = (_req: Request, res: Response) => {
		const code = 403;
		const response = {
			statusCode: code,
			message: "access denied",
		};
		res.setHeader('Content-Type', 'application/json');
		res.status(code).send(JSON.stringify(response));
	};
	const result = new Keycloak({}, keycloakCfg);
	return result;
}

const keycloak:Keycloak.Keycloak = init();

export default keycloak;

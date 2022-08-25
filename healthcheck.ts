import http from 'http';
import cfg from './configuration';

const options = {
	host: 'localhost',
	port: cfg.API_PORT,
	timeout: 5000,
};

const check = http.request(options, (res) => {
	if (res.statusCode < 400) {
		process.exit(0);
	} else {
		process.exit(1);
	}
});

check.on("error", (err) => {
	process.exit(1);
});

check.end();

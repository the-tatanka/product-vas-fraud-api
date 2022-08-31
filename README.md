# Catena-X API

The *Catena-X API* serves as a unified backend for the Dashboard frontend and associated workers within the Catena-X system. It serves information about fraud cases and statistics for authorized Catena-X users, and offers endpoints to workers to store rudimentary fraud event information for statistical analysis.


## Requirements

The minimal requirements to execute this program are

 - Node.js (version 16) - JavaScript runtime environment and
 - npm (version 8) - Node.js package manager.

It can also be executed self-contained as a **Docker** container. In that case only the Docker engine is required:
```sh
> docker build . -t catenax-api
> docker run -it -p 8080:80 catenax-api:latest # accessible on localhost:8080
```

During runtime, *Catena-X API* expects the following components to be accessible and configured:

 - Keycloak access and identity manager,
 - PostgreSQL database (version 14),
 - CDQ Bankaccount Data [REST API](https://developer.cdq.com/documentation/bankaccount-data/quickstart/)


## API Docs

The api documentation is self-hosted under the path `/public/api-docs` as a swagger ui environment.
The `swagger.json` is self-generated and accessible under `/public/swagger.json`.
At time of writing you can find a deployed example here:
 - [swagger ui](https://api.catenax-cdq.com/public/api-docs/).
 - [swagger.json](https://api.catenax-cdq.com/public/swagger.json).


## Configuration

During runtime, the *Catena-X API* parses the system's environment variables to configure its behavior.

The following environment variables must be set:

```sh
CDQ_API_KEY    # CDQ API Key for the bankaccount data REST API.
WORKER_API_KEY # catenax internal API key, used by fraud sync worker for update endpoints.
DB_PASSWORD    # PostgreSQL database password, see also DB_USER and DB_NAME.
```

Additionally one can configure the catenax api using the following environment variables:

```sh
API_PORT            # port the API listenes on (default: 80).
CORS_ALLOW_ORIGIN   # CORS origin to allow (default: http://localhost:3000).
SENTRY_DSN          # activate Sentry with valid DSN (default: '', deactivated).
SENTRY_ENVIRONMENT  # the Sentry environment to emit to (default: production).
DB_HOST             # PostgreSQL host (default: localhost).
DB_PORT             # PostgreSQL port (default: 5432).
DB_USER             # PostgreSQL user (default: dashboard).
DB_NAME             # PostgreSQL database name (default: dashboard).
KEYCLOAK_REALM            # Keycloak realm (default: catenax).
KEYCLOAK_CLIENT_RESOURCE  # Keycloak client resource configured for catenax api (default: catenax-api).
KEYCLOAK_CLIENT_ROLE      # Keycloak user role mapped to client role (default: user).
KEYCLOAK_AUTH_URL         # Keycloak authorization base URL (default: http://localhost:8180/auth).
```


### Docker build arguments

Every environment variable can be preconfigured during the docker build stage using `--build-arg`, with the exception of `CDQ_API_KEY`, `WORKER_API_KEY` and `DB_PASSWORD` as they would persist in the produced docker image.

Example:
```sh
> docker build . -t catenax-api \
    --build-arg SENTRY_ENVIRONMENT="development" \
    --build-arg KEYCLOAK_CLIENT_ROLE="realm:default-roles-catenax"
```


### Docker runtime arguments

The security related configuration parameters can be set while executing the container using `-e` options:

```sh
> docker run ... \
    -e CDQ_API_KEY='key_for_cdq_rest_api' \
    -e WORKER_API_KEY='api_key_for_fraud_sync_worker' \
    -e DB_PASSWORD='your_db_password' \
    catenax-api:latest
```


## Developer quickstart

 - install minimal requirements (node.js and npm),
 - clone the project,
 - install project dependencies:
    ```sh
    > npm i
    ```
 - run the project scripts:
    ```sh
    > npm run lint # code auditor
    > npm run test # unit tests
    > npm run dev # executes the api with default settings, see src/configuration.ts
    ```

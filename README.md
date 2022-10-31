# IP Country API

> A REST API to provide countries from an IP addresses.

*Tested on Node.js LTS (v18)*

Utilizes the following APIs:
- [ipstack](https://ipstack.com/)
- [ipXapi](https://ipxapi.com/)

## Prepare

```bash
npm install
```

## Usage

Start the server with the below command.

```bash
API_TOKEN_IPSTACK="<ipstack access key>" \
  API_TOKEN_IPXAPI="<ipXapi access key>" \
  npm run start
```

Navigate to a URL like so: [http://localhost:3000/countries/156.24.151.42](http://localhost:3000/countries/156.24.151.42)

## Tests

### Unit Tests

Run unit tests with the below command:

```bash
npm run test:unit
```

### End to End Tests

For the purpose of end to end tests, you can run a test server configured with a rate limit timeframe of a few seconds vs the production server that has a 1 hour timeframe. The test server is meant to have one run of end to end tests and then shut down after.

Start the test server with the below command:

```bash
API_TOKEN_IPSTACK="<ipstack access key>" \
  API_TOKEN_IPXAPI="<ipXapi access key>" \
  npm run start:test-server
```

And run end to end tests with this command:

```bash
npm run test:end-to-end
```

## Endpoints

#### `GET /countries/:ip`

> Example success response

```json
{
  "data": {
    "name": "United States"
  },
  "meta": {
    "apiUrl": "https://ipxapi.com/api/ip?ip=156.24.151.42",
    "cache": false,
    "rateLimit": 5,
    "rateLimitCount": 1,
    "status": 200
  }
}
```

> Example error response

```json
{
  "error": {
    "message": "Rate limited"
  },
  "meta": {
    "apiUrl": "https://ipxapi.com/api/ip?ip=156.24.151.42",
    "rateLimit": 5,
    "rateLimitCount": 5,
    "status": 429
  }
}
```

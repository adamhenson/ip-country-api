export const DEFAULT_RATE_LIMIT = 5;
export const DEFAULT_RATE_LIMIT_TIMEFRAME = 3600000; // 1 hour

export const apis = {
  ipstack: {
    baseUrl: 'http://api.ipstack.com',
    rateLimit: Number(
      process.env.RATE_LIMIT_IPSTACK || DEFAULT_RATE_LIMIT
    ),
    rateLimitTimeframe: Number(
      process.env.RATE_LIMIT_TIMEFRAME_IPSTACK || DEFAULT_RATE_LIMIT_TIMEFRAME
    ),
    token: process.env.API_TOKEN_IPSTACK,
  },
  ipxapi: {
    baseUrl: 'https://ipxapi.com/api',
    rateLimit: Number(
      process.env.RATE_LIMIT_IPXAPI || DEFAULT_RATE_LIMIT
    ),
    rateLimitTimeframe: Number(
      process.env.RATE_LIMIT_TIMEFRAME_IPXAPI || DEFAULT_RATE_LIMIT_TIMEFRAME
    ),
    token: process.env.API_TOKEN_IPXAPI,
  },
};

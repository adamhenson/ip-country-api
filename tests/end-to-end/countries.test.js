import { describe, expect, test } from '@jest/globals';

const BASE_URL = process.env.IP_COUNTRY_API_SERVER_URL || 'http://localhost:3000';
const testIps = [
  { ip: '156.24.151.42', country: 'United States' },
  { ip: '14.195.21.85', country: 'India' },
  { ip: '51.170.254.49', country: 'United Kingdom' },
  { ip: '105.47.151.243', country: 'Egypt' },
  { ip: '102.137.23.112', country: 'Ivory Coast' },
  { ip: '221.47.149.135', country: 'Japan' },
]

describe('GET /countries/:ip', () => {
  test('returns country name and corresponding meta data', async () => {
    const response = await fetch(`${BASE_URL}/countries/${testIps[0].ip}`);
    const result = await response.json();
    expect(result.data.name).toEqual(testIps[0].country);
    expect(result.meta.rateLimitCount).toEqual(1);
    expect(result.meta.status).toEqual(200);
    expect(result.meta.apiUrl.includes('api.ipstack.com')).toEqual(true);
  });

  test('returns data from cache for IP addresses previously requested', async () => {
    const response = await fetch(`${BASE_URL}/countries/${testIps[0].ip}`);
    const result = await response.json();
    expect(result.data.name).toEqual(testIps[0].country);
    expect(result.meta.rateLimitCount).toEqual(1);
    expect(result.meta.cache).toEqual(true);
  });

  test(
    'returns country name from secondary API when rate limit is met from the primary',
    async () => {
      await fetch(`${BASE_URL}/countries/${testIps[1].ip}`);
      const response = await fetch(`${BASE_URL}/countries/${testIps[2].ip}`);
      const result = await response.json();
      expect(result.data.name).toEqual(testIps[2].country);
      expect(result.meta.rateLimitCount).toEqual(1);
      expect(result.meta.status).toEqual(200);
      expect(result.meta.apiUrl.includes('ipxapi.com')).toEqual(true);
    }
  );

  test(
    'returns rate limit error when all APIs have met rate limit',
    async () => {
      await fetch(`${BASE_URL}/countries/${testIps[3].ip}`);
      const response = await fetch(`${BASE_URL}/countries/${testIps[4].ip}`);
      const result = await response.json();
      expect(response.status).toEqual(429);
      expect(result.error.message).toEqual('Rate limited');
      expect(result.meta.rateLimitCount).toEqual(result.meta.rateLimit);
      expect(result.meta.status).toEqual(429);
      expect(result.meta.apiUrl.includes('ipxapi.com')).toEqual(true);
    }
  );

  test(
    'returns country name and corresponding meta data after rate limit reset',
    async () => {
      // delay for 3 seconds (rate limit timeframe of the test server)
      await new Promise(resolve => setTimeout(() => resolve(), 3000));

      const response = await fetch(`${BASE_URL}/countries/${testIps[5].ip}`);
      const result = await response.json();
      expect(result.data.name).toEqual(testIps[5].country);
      expect(result.meta.rateLimitCount).toEqual(1);
      expect(result.meta.status).toEqual(200);
      expect(result.meta.apiUrl.includes('ipxapi.com')).toEqual(true);
    }
  );
});

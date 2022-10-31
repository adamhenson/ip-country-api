import { describe, expect, jest, test } from '@jest/globals';
import ApiClient, { formatResult } from '../../../src/services/api-client';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      country_name: 'Somewhere',
    }),
    ok: true,
    status: 200,
    statusText: 'OK',
  })
);

beforeEach(() => {
  fetch.mockClear();
});

describe('formatResult', () => {
  test('formats error result', () => {
    expect(formatResult({
      apiUrl: 'https://www.foo.software',
      error: {
        message: 'Unauthorized',
        status: 401,
      },
    })).toEqual({
      error: {
        message: 'Unauthorized',
      },
      meta: {
        apiUrl: 'https://www.foo.software',
        status: 401,
      },
    });
  });

  test('formats successful result', () => {
    expect(formatResult({
      cache: true,
      country: 'United States',
      rateLimit: 5,
      rateLimitCount: 1,
    })).toEqual({
      data: {
        country: 'United States',
      },
      meta: {
        cache: true,
        rateLimit: 5,
        rateLimitCount: 1,
        status: 200,
      },
    });
  });
});

describe('ApiClient', () => {
  let apiClient;
  let ip;
  let token;
  let apiUrl;

  beforeEach(() => {
    ip = '111.22.333.44';
    token = 'abc123';
    apiUrl = `http://api.ipstack.com/${ip}?access_key=${token}`;
    apiClient = new ApiClient({
      baseUrl: 'http://api.ipstack.com',
      rateLimit: 5,
      rateLimitTimeframe: 60000,
      token,
    });
  });

  describe('ApiClient.getCountry', () => {
    test('returns country name and corresponding meta data', async () => {
      const result = await apiClient.getCountry(ip);
      expect(result).toEqual({
        data: {
          name: 'Somewhere',
        },
        meta: {
          apiUrl,
          cache: false,
          rateLimit: 5,
          rateLimitCount: 1,
          status: 200,
        },
      });
    });

    test('returns error and corresponding meta data when fetch returns an error', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      }));
      const result = await apiClient.getCountry(ip);
      expect(result).toEqual({
        error: {
          message: '401 Unauthorized',
        },
        meta: {
          apiUrl,
          rateLimit: 5,
          rateLimitCount: 1,
          status: 401,
        },
      });
    });

    test('returns error and corresponding meta data when fetch returns an error', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      }));
      const result = await apiClient.getCountry(ip);
      expect(result).toEqual({
        error: {
          message: '403 Forbidden',
        },
        meta: {
          apiUrl,
          rateLimit: 5,
          rateLimitCount: 1,
          status: 403,
        },
      });
    });

    test(
      'returns error and corresponding meta data when API successfully responds, '
      + 'but with an error result',
      async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve({
            error: {
              info: 'Invalid access key',
              type: 'invalid_access_key',
            },
          }),
          ok: true,
          status: 200,
          statusText: 'OK',
        }));
        const result = await apiClient.getCountry(ip);
        expect(result).toEqual({
          error: {
            message: 'Invalid access key',
          },
          meta: {
            apiUrl,
            rateLimit: 5,
            rateLimitCount: 1,
            status: 401,
          },
        });
      }
    );

    test('returns error and corresponding meta data when rate limit is met', async () => {
      await apiClient.getCountry('1.1.1.1');
      await apiClient.getCountry('2.2.2.2');
      await apiClient.getCountry('3.3.3.3');
      await apiClient.getCountry('4.4.4.4');
      await apiClient.getCountry('5.5.5.5');
      const result = await apiClient.getCountry(ip);
      expect(result).toEqual({
        error: {
          message: 'Rate limited',
        },
        meta: {
          apiUrl,
          rateLimit: 5,
          rateLimitCount: 5,
          status: 429,
        },
      });
      expect(apiClient.isRateLimited).toEqual(true);
    });

    describe('ApiClient.isRateLimited', () => {
      test('evaluates to false when rate limit is not met', async () => {
        await apiClient.getCountry(ip);
        expect(apiClient.isRateLimited).toEqual(false);
      });

      test('evaluates to true when rate limit is met', async () => {
        await apiClient.getCountry('1.1.1.1');
        await apiClient.getCountry('2.2.2.2');
        await apiClient.getCountry('3.3.3.3');
        await apiClient.getCountry('4.4.4.4');
        await apiClient.getCountry('5.5.5.5');
        await apiClient.getCountry(ip);
        expect(apiClient.isRateLimited).toEqual(true);
      });
    });

    describe('ApiClient.transferCache', () => {
      test('merges cache map', async () => {
        await apiClient.getCountry(ip);
        const mockApiClient = {
          cache: new Map(),
        };
        mockApiClient.cache.set('1.1.1.1', 'My Country');
        apiClient.transferCache(mockApiClient);
        expect(apiClient.cache.get(ip)).toEqual('Somewhere');
        expect(apiClient.cache.get('1.1.1.1')).toEqual('My Country');
      });
    });
  });
});

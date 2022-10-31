import { describe, expect, test } from '@jest/globals';
import ApiClientOrchestrator from '../../../src/services/api-client-orchestrator';

describe('ApiClientOrchestrator', () => {
  let apiClientMock1;
  let apiClientMock2;

  beforeEach(() => {
    const transferCache = () => (undefined);
    apiClientMock1 = {
      _id: 'a', isRateLimited: false,
      transferCache,
    };
    apiClientMock2 = {
      _id: 'b', isRateLimited: false,
      transferCache,
    };
  });

  describe('ApiClientOrchestrator.apiClient', () => {
    test('returns the first API client when both have not rate limited', async () => {
      const apiClientOrchestrator = new ApiClientOrchestrator({
        apiClients: [apiClientMock1, apiClientMock2],
      });
      expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock1);
    });

    test('returns the second API client when the first is rate limited', async () => {
      apiClientMock1.isRateLimited = true;
      const apiClientOrchestrator = new ApiClientOrchestrator({
        apiClients: [apiClientMock1, apiClientMock2],
      });
      expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock2);
    });

    test(
      'returns non-rate limited API client when checked multiple times '
      + 'and rate limits are changing',
      async () => {
        const apiClientOrchestrator = new ApiClientOrchestrator({
          apiClients: [apiClientMock1, apiClientMock2],
        });
        expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock1);
        apiClientMock1.isRateLimited = true;
        expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock2);
        apiClientMock1.isRateLimited = false;
        apiClientMock2.isRateLimited = true;
        expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock1);
      }
    );

    test('returns the current API client when both rate limited', async () => {
      apiClientMock1.isRateLimited = true;
      apiClientMock2.isRateLimited = true;
      const apiClientOrchestrator = new ApiClientOrchestrator({
        apiClients: [apiClientMock1, apiClientMock2],
      });
      expect(apiClientOrchestrator.apiClient).toEqual(apiClientMock1);
    });
  });
});

import ApiClientIpstack from '../services/api-client.js';
import ApiClientIpxapi from '../services/api-client-ipxapi.js';
import ApiClientOrchestrator from '../services/api-client-orchestrator.js';
import { apis } from '../config.js';

const apiClientOrchestrator = new ApiClientOrchestrator({
  apiClients: [
    new ApiClientIpstack({
      baseUrl: apis.ipstack.baseUrl,
      rateLimit: apis.ipstack.rateLimit,
      rateLimitTimeframe: apis.ipstack.rateLimitTimeframe,
      token: apis.ipstack.token,
    }),
    new ApiClientIpxapi({
      baseUrl: apis.ipxapi.baseUrl,
      rateLimit: apis.ipxapi.rateLimit,
      rateLimitTimeframe: apis.ipxapi.rateLimitTimeframe,
      token: apis.ipxapi.token,
    }),
  ],
});

/**
 * Route controller to get a country for a provided IP.
 * @param {string} path - Express path.
 * @param {Promise} middleware - Express middleware.
 */
export const getCountry = async (req, res) => {
  const result = await apiClientOrchestrator.apiClient.getCountry(req.params.ip);
  res.status(result.meta.status).json(result);
};

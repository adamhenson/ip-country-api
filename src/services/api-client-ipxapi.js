import ApiClient, { ApiError } from './api-client.js';

/**
 * An ApiClient extended class specifically for the ipXapi (https://ipxapi.com/).
 * See ApiClient definition for JSDoc types.
 * @extends ApiClient
 */
export default class ApiClientIpxapi extends ApiClient {
  constructor(options) {
    super(options);
    this._headers = {
      accept: 'application/json',
      authorization: `Bearer ${options.token}`,
    };
  }

  getCountryApiUrl(ip) {
    return `${this._baseUrl}/ip?ip=${ip}`;
  }

  getCountryNameFromResult(result) {
    return result.country;
  }

  validateResult(result) {
    if (result.success === false) {
      throw new ApiError(
        result.message || 'An unknown error occurred',
        { status: 400 }
      );
    }
  }
}

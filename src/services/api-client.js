import { DEFAULT_RATE_LIMIT_TIMEFRAME } from '../config.js';

/**
 * A custom error class to provide extra, API specific info.
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * @param {string} message - An error message.
   * @param {object} [info] - Additional error info.
   * @param {number} [info.status] - An HTTP response status code.
   */
  constructor(message, info) {
    super(message);
    this.status = info && info.status || 400;
  }
}

/**
 * Returns a formatted result to provide consistency in result shape. Results
 * will represent either data or an error with any meta data.
 * @param {object} payload
 * @param {string} [payload.apiUrl] - URL from the providing API.
 * @param {boolean} [payload.cache] - Is true if the result came from cache.
 * @param {number} [payload.rateLimit] - The rate limit for the providing API.
 * @param {number} [payload.rateLimitCount] - The current rate limit count.
 * @param {object} [payload.error] - A resulting error if applicable.
 * @param {string} [payload.error.message] - An error message.
 * @param {number} [payload.error.status] - An HTTP response status code.
 * @param {...*} [result] - Any resulting data for the successful response.
 * @returns {object} result - The returned result.
 * @returns {object} [result.error] - A resulting error object from a failed request.
 * @returns {string} [result.error.message] - A resulting error message.
 * @returns {...*} [result.data] - Any resulting from a successful response.
 * @returns {object} result.meta - Meta data for corresponding data or error.
 * @returns {string} [result.meta.apiUrl] - URL from the providing API.
 * @returns {string} [result.meta.apiUrl] - URL from the providing API.
 * @returns {number} [result.meta.rateLimit] - The rate limit for the providing API.
 * @returns {number} [result.meta.rateLimitCount] - The current rate limit count.
 * @returns {number} [payload.error.status] - An HTTP response status code.
 */
export const formatResult = ({
  apiUrl,
  cache = false,
  rateLimit,
  rateLimitCount,
  ...result
}) => {
  if (result.error) {
    const status = result.error.status || 400;
    return {
      error: {
        message: result.error.message,
      },
      meta: {
        apiUrl,
        rateLimit,
        rateLimitCount,
        status,
      },
    };
  }

  return {
    data: result,
    meta: {
      apiUrl,
      cache,
      rateLimit,
      rateLimitCount,
      status: 200,
    },
  }
};

/**
 * An API client class to accommodate ipstack API (https://ipstack.com/), but extendable
 * to accommodate other APIs.
 */
export default class ApiClient {
  /**
   * The base URL of the API.
   * @property {string}
   */
  _baseUrl;

  /**
   * A cache map to store API response values.
   * @property {Map<string, string>}
   */
  _cache = new Map();

  /**
   * Headers sent with the API fetch.
   * @property {object}}
   */
  _headers;

  /**
   * The rate limit for the providing API.
   * @property {number}
   */
  _rateLimit;

  /**
   * The current rate limit count.
   * @property {number}
   */
  _rateLimitCount = 0;

  /**
   * Rate limit expiry in milliseconds from epoch.
   * @property {number}
   */
  _rateLimitExpiry;

  /**
   * Rate limit timeframe in milliseconds untile expiry.
   * @property {number}
   */
  _rateLimitTimeframe = DEFAULT_RATE_LIMIT_TIMEFRAME;

  /**
   * An authorization token for the providing API.
   * @property {string}
   */
  _token;

  /**
   * @param {object} config
   * @param {string} config.baseUrl - The base URL of the API.
   * @param {string} config.rateLimit - The rate limit for the providing API.
   * @param {string} [config.rateLimitTimeframe] - Rate limit timeframe in milliseconds
   *  until expiry.
   * @param {string} config.token - An authorization token for the providing API.
   */
  constructor({ baseUrl, rateLimit, rateLimitTimeframe, token }) {
    if (typeof baseUrl !== 'string') {
      throw new Error(`'baseUrl' option is invalid`);
    }
    if (typeof rateLimit !== 'number') {
      throw new Error(`'rateLimit' option is invalid`);
    }
    if (typeof token !== 'string') {
      throw new Error(`'token' option is invalid`);
    }
    if (rateLimitTimeframe) {
      this._rateLimitTimeframe = rateLimitTimeframe;
    }
    this._baseUrl = baseUrl;
    this._rateLimit = rateLimit;
    this._token = token;
  }

  /**
   * Surfaces internal cache to the instantiator.
   * @returns {Map<string, string>} - A cache map.
   */
  get cache() {
    return this._cache;
  }

  /**
   * Surfaces a rate limit status to the instantiator.
   * @returns {boolean} - True if rate limit has been met.
   */
  get isRateLimited() {
    if (this.isRateLimitExpired()) {
      return false;
    }
    return this._rateLimitCount >= this._rateLimit;
  }

  /**
   * Formats success or error result specific to this class instance. Payload
   * params and return values are the same as the `formatResult` function it calls.
   * @param {object} payload
   * @returns {object} - The formatted result.
   */
  formatResult(payload) {
    return formatResult({
      ...payload,
      rateLimit: this._rateLimit,
      rateLimitCount: this._rateLimitCount,
    });
  }

  /**
   * Resets and / or updates rate limit if applicable and throws an error
   * if rate limit has been met.
   */
  handleRateLimiting() {
    // reset rate limit if applicable
    if (this.isRateLimitExpired()) {
      this._rateLimitExpiry = Date.now() + this._rateLimitTimeframe;
      this._rateLimitCount = 0;
    }

    if (this.isRateLimited) {
      throw new ApiError('Rate limited', { status: 429 });
    }

    this._rateLimitCount++;
  }

  /**
   * Returns a rate limit timeframe expiration status
   * @returns {boolean} - True if rate limit has expired or hasn't started timing
   */
  isRateLimitExpired() {
    return !this._rateLimitExpiry || Date.now() > this._rateLimitExpiry;
  }

  /**
   * Returns a country name based on a provided IP address. Return object is the
   * same that is returned from the `formatResult` function.
   * @param {string} ip - An IP address.
   * @returns {object} - The formatted result.
   */
  async getCountry(ip) {
    const apiUrl = this.getCountryApiUrl(ip);

    try {
      // use cache when available
      const cachedCountryName = this._cache.get(ip);
      if (cachedCountryName) {
        return this.formatResult({
          cache: true,
          name: cachedCountryName,
        });
      }

      this.handleRateLimiting();

      // fetch from the API
      const response = await fetch(apiUrl, {
        headers: this._headers,
      });

      // validation
      this.validateResponse(response);
      const result = await response.json();
      this.validateResult(result);
      const name = this.getCountryNameFromResult(result);
      if (!name) {
        throw new ApiError('Country not found for this IP', {
          status: 400,
        });
      }

      this._cache.set(ip, name);
      return this.formatResult({
        apiUrl,
        name,
      });
    } catch (error) {
      // log error if it wasn't user generated
      if (!error.status || error.status >= 500) {
        console.error(error);
      }

      return this.formatResult({ apiUrl, error });
    }
  }

  /**
   * Returns the API URL of the endpoint that gets a country by IP. This
   * is useful for classes that extend this to accommodate a variety of APIs.
   * @param {string} ip - An IP address.
   * @returns {string} - The API URL of the endpoint that gets a country by IP.
   */
  getCountryApiUrl(ip) {
    return `${this._baseUrl}/${ip}?access_key=${this._token}`;
  }

  /**
   * Returns a country name from the API result. This is useful for classes
   * that extend this to accommodate a variety of APIs.
   * @param {object} result - A result returned from the providing API.
   * @returns {string} - A country name.
   */
  getCountryNameFromResult(result) {
    return result.country_name;
  }

  /**
   * Accepts an instance of ApiClient and merges its cache onto this instance's.
   * @param {ApiClient} apiClient - An instance of an ApiClient class.
   */
  transferCache(apiClient) {
    this._cache = new Map([...this._cache, ...apiClient.cache]);
  }

  /**
   * Validates the fetched API response. Throws corresponding error when appropriate.
   * @param {object} response - A response from the API fetch.
   */
  validateResponse(response) {
    if (!response.ok) {
      throw new ApiError(`${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }
  }

  /**
   * Validates the API result. Throws corresponding error when appropriate.
   * Checks if response identifies as unauthorized and surfaces error
   * accordingly.
   * @param {object} result - A result from the API.
   */
  validateResult(result) {
    if (result.error) {
      throw new ApiError(
        result.error.info || result.error.type || 'An unknown error occurred',
        {
          status: result.error.type !== 'invalid_access_key'
            ? 400
            : 401,
        }
      );
    }
  }
}

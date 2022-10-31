/**
 * An ApiClient class instance orchestrator. Determines and returns clients that
 * aren't rate limited when possible.
 */
export default class ApiClientOrchestrator {
  /**
   * The active ApiClient class instance
   * @property {ApiClient}
   * @private
   */
  #activeApiClient;

  /**
   * A list of available ApiClient class instances
   * @property {ApiClient[]}
   * @private
   */
  #apiClients = [];

  /**
   * @param {object} config
   * @param {ApiClient[]} config.apiClients - A list of available ApiClient class
   *  instances
   */
  constructor({ apiClients }) {
    this.#apiClients = apiClients;
    this.#activeApiClient = apiClients[0];
  }

  /**
   * Returns an ApiClient class instance that is not rate limited when one
   * is available, otherwise it will the return current. This also sets
   * the active ApiClient based on the above.
   * @returns {ApiClient} - An ApiClient class instance.
   */
  get apiClient() {
    // if the currently active API client isn't rate limited,
    // just continue using it
    if (!this.#activeApiClient.isRateLimited) {
      return this.#activeApiClient;
    }
  
    const qualifiedApiClient = this.#apiClients.find((apiClient) => (
      !apiClient.isRateLimited
    ));

    // if no qualified, then just use the currently active API client
    if (!qualifiedApiClient) {
      return this.#activeApiClient;
    }

    // transfer cache from current API client to the next
    qualifiedApiClient.transferCache(this.#activeApiClient);

    this.#activeApiClient = qualifiedApiClient;
    return this.#activeApiClient;
  }
}

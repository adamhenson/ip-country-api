import { getCountry } from '../controllers/countries.js';

/**
 * Binds routes to controllers.
 * @param {object} app - Express app.
 */
export default (app) => {
  app.get('/countries/:ip', getCountry);
};

/**
 * Models Index
 * Central export point for all Mongoose models
 */

const TSPToken = require('./TSPToken');
const ConsentRequest = require('./ConsentRequest');
const WebhookEvent = require('./WebhookEvent');
const TxnStatusHistory = require('./TxnStatusHistory');
const Report = require('./Report');
const BSARun = require('./BSARun');
const Error = require('./Error');

module.exports = {
  TSPToken,
  ConsentRequest,
  WebhookEvent,
  TxnStatusHistory,
  Report,
  BSARun,
  Error
};


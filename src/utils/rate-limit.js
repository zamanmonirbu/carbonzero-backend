const rateLimit = require("express-rate-limit");
const { rateLimitWindow, rateLimitMax, rateLimitDelay } = require("../config");

const windowMs = parseInt(rateLimitWindow || "12", 10) * 60 * 60 * 1000;
const max = parseInt(rateLimitMax || "9", 10);
const delayMs = parseInt(rateLimitDelay || "0", 10);

const resetPasswordLimiter = rateLimit({
  windowMs,
  max,
  delayMs,
});

module.exports = resetPasswordLimiter;

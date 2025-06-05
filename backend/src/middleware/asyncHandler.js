/**
 * Wraps an async route handler to automatically catch errors and forward them to Express error handler
 * @param {Function} fn The async route handler function
 * @returns {Function} The wrapped route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 
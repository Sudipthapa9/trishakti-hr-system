/**
 * Handles authentication and unexpected errors without exposing internal error details to API clients.
 */
// Translate JWT failures to 401 and unexpected errors to a generic 500 response.
function errorHandler(err, req, res, next) {
  // JWT middleware identifies authentication errors with this name.
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid or missing token" });
  }
  // Record the internal error server-side; return a generic message to the client.
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;

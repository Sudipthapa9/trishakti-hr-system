/**
 * Validates incoming JSON bodies with a caller-provided schema before route handling.
 */
// Create middleware that validates and normalizes req.body using the supplied schema.
function validate(schema) {
  return (req, res, next) => {
    // Use safeParse so invalid client input becomes a controlled 400 response.
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }
    // Pass the schema-normalized body to subsequent handlers.
    req.body = result.data;
    next();
  };
}

module.exports = validate;

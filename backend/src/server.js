/**
 * Loads backend environment variables before importing the app and opens the HTTP listener.
 */
// Load local configuration before modules read environment variables.
require("dotenv").config();
const app = require("./app");

// Use the configured deployment port, or the local development default.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

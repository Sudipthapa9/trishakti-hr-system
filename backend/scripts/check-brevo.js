const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const { checkBrevoConnection } = require("../src/services/brevo");

checkBrevoConnection()
  .then(() => console.log("Brevo connection and verified sender check passed. No email was sent."))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

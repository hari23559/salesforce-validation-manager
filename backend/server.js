const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jsforce = require("jsforce");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salesforce Validation Manager Backend Running");
});

app.get("/auth/login", (req, res) => {
  console.log("LOGIN_URL =", process.env.LOGIN_URL);
  console.log("REDIRECT_URI =", process.env.REDIRECT_URI);

  const authUrl =
    `${process.env.LOGIN_URL}/services/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;

  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      `${process.env.LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        code: code
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    global.accessToken = response.data.access_token;
    global.instanceUrl = response.data.instance_url;

    console.log(
      "Access Token:",
      global.accessToken ? "Received" : "Missing"
    );
    console.log("Instance URL:", global.instanceUrl);

    res.send(
      "Salesforce login successful. Access token received."
    );
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).send("Failed to get access token.");
  }
});

app.get("/validation-rules", async (req, res) => {
  try {
    const conn = new jsforce.Connection({
      instanceUrl: global.instanceUrl,
      accessToken: global.accessToken
    });

    const result = await conn.tooling.query(`
      SELECT Id,
             ValidationName,
             Active,
             EntityDefinition.QualifiedApiName
      FROM ValidationRule
      WHERE EntityDefinition.QualifiedApiName='Account'
    `);

    res.json(result.records);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch validation rules");
  }
});

app.post("/toggle-rule", async (req, res) => {
  const { ruleName, active } = req.body;

  try {
    const conn = new jsforce.Connection({
      instanceUrl: global.instanceUrl,
      accessToken: global.accessToken
    });

    const fullName = `Account.${ruleName}`;

    const metadata = await conn.metadata.read(
      "ValidationRule",
      fullName
    );

    if (!metadata) {
      return res.status(404).json({
        message: "Validation rule not found"
      });
    }

    metadata.active = active;

    const result = await conn.metadata.update(
      "ValidationRule",
      metadata
    );

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
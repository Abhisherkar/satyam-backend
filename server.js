const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ---------- ENV VAR CHECK ----------
if (!process.env.SENDGRID_API_KEY) {
  console.error("Missing SENDGRID_API_KEY - emails will fail!");
}
if (!process.env.EMAIL_FROM || !process.env.EMAIL_TO) {
  console.error("Missing EMAIL_FROM or EMAIL_TO - emails will fail!");
}

// ---------- SENDGRID SETUP ----------
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ---------- SEND EMAIL ----------
async function sendEmail(type, payload) {
  try {
    if (type !== "inquiry" || !payload) {
      console.error("Invalid type or missing payload for email");
      return false;
    }

    const { name = "Unknown", fromEmail = "No email provided", phone = "No phone provided", message = "No message provided" } = payload;

    const msg = {
      to: process.env.EMAIL_TO,
      from: process.env.EMAIL_FROM,
      subject: `New Inquiry - ${name}`,
      html: `
        <h2>New Inquiry</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${fromEmail}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${process.env.EMAIL_TO}`);
    return true;
  } catch (err) {
    console.error("SENDGRID ERROR:", err.response ? err.response.body : err);
    return false;
  }
}

// ---------- SEND WHATSAPP ----------
async function sendWhatsapp(payload) {
  try {
    const SID = process.env.TWILIO_ACCOUNT_SID;
    const TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const FROM = process.env.TWILIO_WHATSAPP_FROM;
    const TO = process.env.WHATSAPP_TO;

    if (!SID || !TOKEN || !FROM || !TO) {
      console.log("Twilio env vars missing - skipping WhatsApp");
      return false;
    }

    const client = twilio(SID, TOKEN);

    const body =
      "NEW INQUIRY:\n" +
      Object.entries(payload || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

    await client.messages.create({
      from: "whatsapp:" + FROM,
      to: "whatsapp:" + TO,
      body,
    });

    console.log(`WhatsApp sent successfully to ${TO}`);
    return true;
  } catch (err) {
    console.error("WHATSAPP ERROR:", err);
    return false;
  }
}

// ---------- MAIN ROUTE ----------
app.post("/api/notify", async (req, res) => {
  const { type, payload } = req.body || {};

  if (!type || !payload) {
    console.error("Request missing type or payload");
    return res.status(400).json({ ok: false, error: "Missing type or payload" });
  }

  if (type !== "inquiry") {
    console.error(`Invalid type: ${type}`);
    return res.status(400).json({ ok: false, error: "Invalid type - must be 'inquiry'" });
  }

  const email = await sendEmail(type, payload);
  const whatsapp = await sendWhatsapp(payload);

  return res.json({ ok: true, email, whatsapp });
});

// ---------- START SERVER ----------
const port = process.env.PORT || 5501;
app.listen(port, () => console.log("Server running on port", port));
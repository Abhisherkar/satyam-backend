const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ---------- SENDGRID SETUP ----------
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ---------- SEND EMAIL ----------
async function sendEmail(type, payload) {
  try {
    const msg = {
      to: process.env.EMAIL_TO,
      from: process.env.EMAIL_FROM,
      subject: `New Inquiry - ${payload?.name || "User"}`,
      html: `
        <h2>New Inquiry</h2>
        <p><b>Name:</b> ${payload?.name}</p>
        <p><b>Email:</b> ${payload?.fromEmail}</p>
        <p><b>Phone:</b> ${payload?.phone}</p>
        <p><b>Message:</b> ${payload?.message}</p>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (err) {
    console.error("SENDGRID ERROR:", err);
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

    if (!SID || !TOKEN || !FROM || !TO) return false;

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

    return true;
  } catch (err) {
    console.error("WHATSAPP ERROR:", err);
    return false;
  }
}

// ---------- MAIN ROUTE ----------
app.post("/api/notify", async (req, res) => {
  const { type, payload } = req.body || {};

  const email = await sendEmail(type, payload);
  const whatsapp = await sendWhatsapp(payload);

  return res.json({ ok: true, email, whatsapp });
});

// ---------- START SERVER ----------
const port = process.env.PORT || 5501;
app.listen(port, () => console.log("Server running on port", port));

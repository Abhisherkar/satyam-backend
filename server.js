const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- EMAIL SENDER ----------------
function createTransport() {
  if (
    !process.env.SENDGRID_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.EMAIL_TO
  ) return null;

  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY
    }
  });
}

// ---------------- ROUTE ----------------
app.post("/api/notify", async (req, res) => {
  const transporter = createTransport();
  let emailSent = false;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: "New Inquiry",
        text: JSON.stringify(req.body, null, 2)
      });
      emailSent = true;
    }
  } catch (e) {
    console.log("EMAIL ERROR", e.message);
    emailSent = false;
  }

  res.json({ ok: true, email: emailSent });
});

// ---------------- START SERVER ----------------
const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Backend running on " + port));

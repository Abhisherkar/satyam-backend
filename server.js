const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/api/notify", async (req, res) => {
  const { type, payload } = req.body || {};

  if (type !== "inquiry" || !payload) {
    return res.status(400).json({ ok: false, error: "Invalid request" });
  }

  let email = false;
  try {
    await sgMail.send({
      to: process.env.EMAIL_TO,
      from: process.env.EMAIL_FROM,
      subject: `New Inquiry - ${payload.name || "User"}`,
      html: `<h2>New Inquiry</h2>
             <p><b>Name:</b> ${payload.name}</p>
             <p><b>Email:</b> ${payload.fromEmail}</p>
             <p><b>Phone:</b> ${payload.phone}</p>
             <p><b>Message:</b> ${payload.message}</p>`,
    });
    email = true;
  } catch (e) {
    console.error("SendGrid Error:", e.response?.body || e.message);
  }

  res.json({ ok: true, email, whatsapp: false });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

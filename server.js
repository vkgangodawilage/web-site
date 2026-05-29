import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS properly for local testing & deployment origins
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Parse JSON payloads
app.use(express.json());

// Set up Nodemailer Transporter using explicit Gmail SMTP parameters
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP CONNECTION FAILED:', error);
  } else {
    console.log('SMTP READY TO SEND');
  }
});

// API Route to handle contact messages
app.post('/api/send-message', async (req, res) => {
  const { name, email, message } = req.body;

  // 1. Payload Input Validations
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name payload is missing' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email payload is missing' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Invalid email routing format' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message content is missing' });
  }

  try {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });

    // 3. Compose Email Structure (HTML + Text fallback)
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // From user (authenticated email account required by Gmail SMTP)
      replyTo: email.trim(), // Reply to client visitor
      to: 'vihangakaveeshavg@gmail.com', // Recipient address
      subject: `New Portfolio Message from ${name.trim()}`,
      text: `
=== Portfolio Contact Notification ===

Name: ${name.trim()}
Email: ${email.trim()}
Message:
--------------------------------------
${message.trim()}
--------------------------------------

Timestamp: ${timestamp} (Sri Lanka Time)
======================================
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff1e27; border-radius: 5px; background-color: #0a0a0c; color: #ffffff;">
          <h2 style="color: #ff1e27; border-bottom: 2px solid #ff1e27; padding-bottom: 10px; margin-top: 0;">VIHANGA_SECURE_TUNNEL PORTAL MESSAGE</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #ff1e27; width: 100px;">Sender:</td>
              <td style="padding: 8px 0; color: #e3e4e6;">${name.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #ff1e27;">Email:</td>
              <td style="padding: 8px 0; color: #e3e4e6;"><a href="mailto:${email.trim()}" style="color: #00ffff; text-decoration: none;">${email.trim()}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #ff1e27;">Timestamp:</td>
              <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px;">${timestamp}</td>
            </tr>
          </table>
          <div style="background-color: #121216; border: 1px solid #1a1a24; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 0; font-weight: bold; color: #ff575e; margin-bottom: 10px;">Transmission Payload:</p>
            <p style="margin: 0; color: #f3f4f6; white-space: pre-wrap; line-height: 1.6;">${message.trim()}</p>
          </div>
          <p style="font-size: 10px; color: #71717a; text-align: center; margin-top: 30px; border-top: 1px solid #1a1a24; padding-top: 15px;">
            SECURE COMMS BEACON LOG // VIHANGA GANGODAWILAGE PORTFOLIO
          </p>
        </div>
      `,
    };

    // 4. Dispatch Email Payload
    const info = await transporter.sendMail(mailOptions);
    console.log(`[OK] Message routed successfully: ${info.messageId}`);
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });

  } catch (error) {
    console.error('[ERROR] Error dispatching mail via SMTP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'SMTP payload routing failed. Check server configuration logs' 
    });
  }
});

// Serve frontend static build if in production environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`[SYS] Server running securely on port ${PORT}`);
  console.log(`[SYS] Recipient set to: vihangakaveeshavg@gmail.com`);
});

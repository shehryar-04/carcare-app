const nodemailer = require('nodemailer');
// const { google } = require('googleapis');
const env = require('dotenv');

env.config();

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shehryarsiddiqui2004@gmail.com',
    pass: process.env.PASSWORD,
  },
});


const mailOptions = {
    from: 'shehryarsiddiqui2004@gmail.com',
    to: 'shehryarsidd@gmail.com',
    subject: 'test',
    html: `
      test email
    `,
  };

transporter.sendMail(mailOptions)
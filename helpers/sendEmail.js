const nodemailer = require("nodemailer");
require("dotenv").config();

const { MT_USER, MT_PASS, SEND_EMAIL } = process.env;

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: MT_USER,
    pass: MT_PASS,
  },
});

function sendEmail(message) {
  message.from = SEND_EMAIL;

  return transport.sendMail(message);
}

module.exports = sendEmail;

const nodemailer = require("nodemailer");

/**
 * @description This file contains the function to send email using nodemailer
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Send email using nodemailer
 * @param {*} to
 * @param {*} subject
 * @param {*} text
 */
const sendMail = (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) console.log(error);
    else console.log(info);
  });
};

module.exports = sendMail;

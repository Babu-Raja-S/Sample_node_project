var nodemailer = require('nodemailer');
const config = require("../config/app.config.js");

var transporter = nodemailer.createTransport({
    service: config.mailService,
    host: config.mailHost,
    port: config.mailPort,
    secure : false,
    auth: {
        user: config.mailFromAddress,
        pass: config.mailFromPassword
    },
    tls: {
        rejectUnauthorized: false
    }
});
module.exports = transporter;
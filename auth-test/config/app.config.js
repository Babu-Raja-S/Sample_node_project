require('dotenv').config();

const config = {
    host: process.env.APP_HOST,
    port: process.env.APP_PORT,
    tokenValidTime: process.env.TOKEN_VALID_TIME,
    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.MAIL_PORT,
    mailFromAddress: process.env.MAIL_FROM_ADDRESS,
    mailFromPassword: process.env.MAIL_FROM_PASSWORD,
    mailService: process.env.MAIL_SERVICE,
    mobileLogStoragePath: process.env.MOBILE_LOG_STORAGE_PATH

}

module.exports = config;
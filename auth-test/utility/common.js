const bcrypt = require('bcrypt');
const log4js = require('log4js');
const config = require("../config/app.config.js");
const userDetailsLogger = log4js.getLogger('userDetails');
const errorLogger = log4js.getLogger('error');
const crypto = require('crypto');

module.exports =  {
    getHashPassword : getHashPassword,
    passwordComparison : passwordComparison,
    generateSalt : generateSalt,
    generateHash : generateHash,
    validHash : validHash,
    generateAuthToken : generateAuthToken,
    convertHashToText : convertHashToText,
    genRanHex : genRanHex
}

function getHashPassword(password){
    return new Promise(function(resolve, reject) {
        bcrypt.hash(password, bcrypt.genSaltSync(12), function(err, response){
            if (err) {
                userDetailsLogger.error("Error while hash password", err);
                errorLogger.error("Error while hash password", err);
                reject(err);
            } else {
                userDetailsLogger.info("Password hashed successfully");
                resolve(response);
            }
        })
    })
}

function passwordComparison(password, encryptedPassword){
    return new Promise(function(resolve, reject) {
        bcrypt.compare(password, encryptedPassword, (err, comparedResult) => {
            if(err){
                reject(err);
            }
            else{
                resolve(comparedResult);
            }
        });
    });
}

function generateSalt(){
    return crypto.randomBytes(16).toString("hex");
}

function generateHash(password, salt){
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
}

function validHash (str, salt, hash){
    const myHash = crypto
      .pbkdf2Sync(str, salt, 1000, 64, `sha512`)
      .toString(`hex`);
    return myHash === hash;
};

function generateAuthToken(userTypeId, userId){
    const token_salt = crypto.randomBytes(16).toString("hex");
    const token_hash = crypto
        .pbkdf2Sync(userId, token_salt, 1000, 64, `sha512`)
        .toString(`hex`);
    const date = new Date();
    const ttl = date.setDate(date.getDate() + parseInt(config.tokenValidTime)); // expiration date of token "time to live"
    return userTypeId + "." +userId + "." + token_salt + "." + token_hash + "." + ttl;
};

function validHash (str, salt, hash){
    const myHash = crypto
      .pbkdf2Sync(str, salt, 1000, 64, `sha512`)
      .toString(`hex`);
    return myHash === hash;
};

function convertHashToText (data){
    let buffer = Buffer.from(data, 'base64');
    let text = buffer.toString('ascii');
    return text;
};

function genRanHex(){
    return Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, "0");
}
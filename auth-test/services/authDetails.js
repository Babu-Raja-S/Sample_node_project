const request = require('request');
const log4js = require('log4js');
const userDetailsLogger = log4js.getLogger('userDetails');
const errorLogger = log4js.getLogger('error');
const config = require('../config/app.config');
const API_URL = require('../api/ConstantURL'); 
const utility = require('../utility/common'); 
const emailService = require('./mailServices');
const responseBuilder = require("../utility/responseBuilder");
const { convertHashToText } = require('../utility/common');
const path = require("path");
const fs = require("fs-extra");
const handlebars = require("handlebars");
const multer = require('multer');
const findRemoveSync = require('find-remove');
const maxSize = 1 * 8000 * 8000;

const mobileLogFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.mobileLogStoragePath)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

const mobileLogsUpload = multer({ 
    storage: mobileLogFileStorage,
    limits: { fileSize: maxSize },
}).single("log_file");

module.exports =  {
    signUp : signUp,
    activateAccount : activateAccount,
    login : login,
    sendResetPasswordMail : sendResetPasswordMail,
    updatePassword : updatePassword,
    getServerVersion : getServerVersion,
    uploadMobileLogs : uploadMobileLogs
}

function signUp(req, res){
    var data = req.body;
    var email_id;
   
    var password = data.password;
    if(req.headers["view-type"]=="Desktop"){
        email_id = utility.convertHashToText(data.email_id);
        password = utility.convertHashToText(data.password);
        data.email_id = email_id;
    }
    var client_id = utility.genRanHex();
    var salt = utility.generateSalt();
    var hash = utility.generateHash(password, salt);
    userDetailsLogger.info("Register user details "+ data.email_id);
    data.salt = salt;
    data.hash = hash;
    data.client_id = client_id;
    request.post(API_URL.signUp, {json: data}, function (err, response) {
        if (err) {
            userDetailsLogger.error("Error while register user details : ", err);
            errorLogger.error("Error while register user details : ", err);
            res.send(err);
        } else {
            if(response.body.status == "success"){
                sendEmail(data.email_id, req.body.user_type,data.client_id);
                res.send(response.body);
            }
            else{
                res.send(response.body);
            }
        }
    });
}

function activateAccount(req, res){
    var data = req.query;
    //var email_id = utility.convertHashToText(data.email_id);
    data.client_id = data.client_id;
    userDetailsLogger.info("Checking account activation status - " + data.client_id);
    request.put(API_URL.updateActivationFlag, {json: data}, function (err, response) {
        if (err) {
            userDetailsLogger.error("Error while check account activation status ", err);
            errorLogger.error("Error while check account activation status ", err);
            res.send(err);
        } else {
            res.send(response.body);
        }
    });
}

function login(req, res){
    var data = req.body;
    if(req.headers["view-type"] == "Desktop"){
        data.email_id = utility.convertHashToText(data.email_id);
        data.password = utility.convertHashToText(data.password);
    }
    userDetailsLogger.info("Verifing user credentials - " + data.email_id);
    request.get(API_URL.login, {json: data}, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            var responseData = response.body;
            var result = {};
            if(responseData.status == "success"){
                var validHash = utility.validHash(data.password, responseData.data.salt, responseData.data.hash);
                if(err){
                    userDetailsLogger.error("Error while verify password", err);
                    errorLogger.error("Error while verify password", err);
                    result.status = "failure";
                    result.message = "Error while verify password";
                } else {
                    if(responseData.data.activation_flag != 1){
                        userDetailsLogger.info("Account not activated");
                        result.status = "failure";
                        result.message = "Account not activated";
                    }else{
                        if(validHash == true){
                            var token = utility.generateAuthToken(responseData.data.user_type_id.toString(), responseData.data.user_id.toString());
                            let finaData = {
                                token: token,
                                user_id: responseData.data.user_id,
                                email_id: responseData.data.email_id,
                                user_type_id: responseData.data.user_type_id,
                                activation_flag: responseData.data.activation_flag,
                                profile_flag: responseData.data.profile_flag            
                            };

                            if(responseData.data.user_type_id == 2 || responseData.data.user_type_id == 1){
                                finaData.first_name = responseData.data.first_name;
                                finaData.last_name = responseData.data.last_name;
                            } else if(responseData.data.user_type_id == 4) {
                                finaData.driver_id = responseData.data.driver_id;
                                finaData.company_name = responseData.data.company_name;
                                finaData.contact_name = responseData.data.contact_name;
                                finaData.company_type_id = responseData.data.company_type_id;
                            } else {
                                finaData.first_name = responseData.data.first_name;
                                finaData.last_name = responseData.data.last_name;
                                finaData.company_name = responseData.data.company_name;
                                finaData.contact_name = responseData.data.contact_name;
                                finaData.company_type_id = responseData.data.company_type_id;
                                finaData.rental_service_flag = responseData.data.rental_service_flag;
                            }
                            
                            userDetailsLogger.info("Login Successful");
                            result.status = "success";
                            result.message = "Login Successful";
                            result.data = finaData;
                        } else {
                            userDetailsLogger.info("Invalid Credentials");
                            result.status = "failure";
                            result.message = "Invalid Credentials";
                        }
                    }
                }
                res.send(result);
            } else {
                result.status = responseData.status;
                result.message = responseData.message;
                res.send(result);
            }
        }
    });
}

function sendEmail(mailId, user_type,clientId){
    var userType;
    if(user_type == "subscriber"){
        userType = "Subscriber";
    }else if(user_type == "driver"){
        userType = "Driver";
    }else if(user_type == "partner"){
        userType = "Partner";
    }else{
        userType = "User"; 
    }
    var activationLink = config.host + "activateAccount?client_id=" + clientId;
    const filePath = path.join(__dirname, '../html/activationMail.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
        userType: userType,
        email: mailId,
        clientId : clientId,
        activationLink: activationLink
    };
    const htmlToSend = template(replacements);
    let mailOptions = {
        to: mailId,
        subject: "Account Activation Link", 
        text: "Activate the account",
        html: htmlToSend
    };
    return new Promise(function(resolve, reject) {
        emailService.sendMail(mailOptions, (err,info) => {
            if (err) {
                userDetailsLogger.error("Error while send activation mail : ", err);
                errorLogger.error("Error while send activation mail : ", err);
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
}

function sendResetPasswordMail(req,res){
    var data = req.body;
    if(req.headers["view-type"]=="Desktop"){
        email_id = utility.convertHashToText(data.email_id);
        data.email_id = email_id;
    }
    userDetailsLogger.info("Fetching user details for Email "+ data.email_id);
    request.get(API_URL.fetchUserByEmailId, {json: data}, function (err, response) {
        if (err) {
            userDetailsLogger.error("Error while fetch user details : ", err);
            errorLogger.error("Error while fetch user details : ", err);
            res.send(err);
        } else {
            if(response.body.status == "failure"){
                res.send(response.body);
            }else{
                var clientId =response.body.data.client_id;
                var mailId = req.body.email_id;
                var resetLink = config.host + "resetPasswordUser?client_id=" + clientId
                const filePath = path.join(__dirname, '../html/resetPasswordMail.html');
                const source = fs.readFileSync(filePath, 'utf-8').toString();
                const template = handlebars.compile(source);
                const replacements = {
                    email: mailId,
                    clientId:clientId,
                    resetPasswordLink: resetLink
                };
                const htmlToSend = template(replacements);               
                let mailOptions = {
                    to: mailId, // list of receivers
                    subject: "Password Reset Link", // Subject line
                    text: "Password Reset Link", // plain text body
                    html: htmlToSend
                };
                return new Promise(function(resolve, reject) {
                    userDetailsLogger.info("Sending reset password mail: ", mailOptions);
                    emailService.sendMail(mailOptions, (err,info) => {
                        if (err) {
                            userDetailsLogger.error("Error while sending reset password mail : ", err);
                            errorLogger.error("Error while sending reset password mail : ", err);
                            res.send(responseBuilder.failureResponse("Error while sending reset password mail"));
                        } else {
                           
                            res.send(responseBuilder.successResponse(null, "Password reset mail sent successfully"));
                        }
                    });
                });
            }
        }
    });
}

function updatePassword(req, res){
    var data = req.body;
    var password = data.password;
    if(req.headers["view-type"]=="Desktop"){
        password = utility.convertHashToText(data.password);
    }
    var salt = utility.generateSalt();
    var hash = utility.generateHash(password, salt);
    data.salt = salt;
    data.hash = hash;
    data.client_id = data.client_id;
    userDetailsLogger.info("Update password for user ", data.client_id);
    request.post(API_URL.updatePassword, {json: data}, function (err, response) {
        if (err) {
            userDetailsLogger.error("Error while update password : ", err);
            errorLogger.error("Error while update password : ", err);
            res.send(err);
        } else {
            res.send(response.body);
        }
    });
}

function getServerVersion(req, res){
    userDetailsLogger.info("Fetching server version");
    request.get(API_URL.getServerVersion, function (err, response) {
        if (err) {
            userDetailsLogger.error("Error while fetch server version : ", err);
            errorLogger.error("Error while fetch server version : ", err);
            res.send(err);
        } else {
            res.send(response.body);
        }
    });
}

function  uploadMobileLogs(req, res){
    var result;
    findRemoveSync(config.mobileLogStoragePath, {
        age: { seconds: 2592000 }
    })
    mobileLogsUpload(req,res,function(err) {
        if(err) {
            userDetailsLogger.error("Error while fetch server version : ", err);
            errorLogger.error("Error while fetch server version : ", err);
            result = {
                "status": "failure",
                "message": "Error while uploading mobile log to server"
            }
        }
        else {
            result = {
                "status": "success",
                "message": "Mobile log shared to server successfully"
            }
        }
        res.send(result);
    })
}

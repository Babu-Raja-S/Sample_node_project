const authDetailsService = require('../services/authDetails');

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
    return authDetailsService.signUp(req, res);
}

function activateAccount(req, res){
    return authDetailsService.activateAccount(req, res);
}

function login(req, res){
    return authDetailsService.login(req, res);
}

function sendResetPasswordMail(req, res){
    return authDetailsService.sendResetPasswordMail(req, res);
}

function updatePassword(req, res){
    return authDetailsService.updatePassword(req, res);
}

function getServerVersion(req, res){
    return authDetailsService.getServerVersion(req, res);
}

function uploadMobileLogs(req, res){
    return authDetailsService.uploadMobileLogs(req, res);
}
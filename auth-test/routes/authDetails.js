var authDetailsController = require('../controller/authDetails');

module.exports =  (router) => {
    router.post('/signUp', authDetailsController.signUp);
    router.get('/activateAccount', authDetailsController.activateAccount);
    router.post('/login', authDetailsController.login);
    router.post('/sendResetPasswordMail', authDetailsController.sendResetPasswordMail);
    router.post('/updatePassword', authDetailsController.updatePassword);
    router.get('/getServerVersion', authDetailsController.getServerVersion);
    router.post("/uploadMobileLogs", authDetailsController.uploadMobileLogs);
    return router;
}
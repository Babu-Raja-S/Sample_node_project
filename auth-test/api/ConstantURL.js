let authService = "http://localhost:4010/";

module.exports = {
	signUp : authService + "api/user/signUp",
	updateActivationFlag : authService + "api/user/updateActivationFlag",
	login : authService + "api/user/login",
	fetchUserByEmailId : authService + "api/user/fetchUserByEmailId",
	updatePassword :  authService + "api/user/updatePassword",
	getServerVersion : authService + "api/user/getServerVersion"
}
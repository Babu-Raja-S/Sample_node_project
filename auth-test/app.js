const express = require('express');
const config = require("./config/app.config.js");
const log4jsConfig = require("./config/log4js.json");

const app = express();
const port = process.env.port || config.port;

const bodyParser = require("body-parser");
var cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const log4js = require('log4js');
log4js.configure(log4jsConfig);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","GET, POST,DELETE,PUT");
    next();
});

require("./routes/authDetails.js")(app);


const server = app.listen(port, function () {
    console.log("Listening on port %s...", server.address().port);
});
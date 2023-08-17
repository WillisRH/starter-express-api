require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const { checkDB, confess } = require("./database");
const app = express();
const ejs = require("ejs");
const routes = require("./routes");
// const client = require("./whatsapp");
// const bodyParser = require("body-parser");

checkDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.listen(2000, () => {
	console.log("go to port", 2000);
});

// initialize the whatsapp bot
// client.initialize();

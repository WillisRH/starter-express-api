const express = require("express");
const { confess } = require("./database");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const bodyParser = require("body-parser");
const postToInsta = require("./instagram");
const routes = express.Router();
const jwt = require("jsonwebtoken");
const Cookies = require("cookies");

const admin_user = process.env.ADMIN_USERNAME;
const admin_pass = process.env.ADMIN_PASSWORD;

// checker for auth
const beforeLoad = (req, res, next) => {
	const cookie = new Cookies(req, res);
	const token = cookie.get("token");
	const decoded = jwt.decode(token);
	console.log(decoded);
	if (token == undefined || token == null || !token || !decoded) {
		return res.redirect("/login");
	} else {
		if (decoded.username == admin_user && decoded.password == admin_pass) {
			next();
		}
	}
};

// upload confession datas to database
routes.post("/new-confess", async (req, res) => {
	const { from, to, message } = req.body;

	console.log(`from: ${from}, to: ${to}, msg: ${message}`);

	if (from == undefined || to == undefined || message == undefined) {
		return res.json({ msg: "ada yang gaberes" });
	}

	try {
		const randomNum = Math.floor(Math.random() * 99999);
		const time = Date.now();
		const today = new Date(time);
		const todayString = today.toDateString();
		await confess.create({
			id: randomNum,
			from: from,
			to: to,
			message: message,
			createdAt: todayString,
		});
		if (req.header("Accept").includes("text/html")) {
			return res.redirect("/confess/success");
		} else {
			return res.status(200).json({
				msg: "Confess berhasil di upload!",
				url: randomNum,
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(201).json({
			msg: "Confess gagal di upload :c, hubungi willis dan fatihul",
		});
	}
});

routes.post("/create-image-and-post", async (req, res) => {
	const { from, to, message, id } = req.body;

	// console.log(`from: ${from}, to: ${to}, msg: ${message}`);

	if (from == undefined || to == undefined || message == undefined) {
		return res.json({ msg: "ada yang gaberes" });
	}

	try {
		// Create a canvas with specified dimensions
		const canvasWidth = 1080;
		const canvasHeight = 1080;
		const canvas = createCanvas(canvasWidth, canvasHeight);
		const ctx = canvas.getContext("2d");

		// Fill canvas with white background
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const bigTextSize = 50;
		ctx.font = `${bigTextSize}px Arial`;
		ctx.fillStyle = "black";

		const bigTextX = 25; // Adjust the X position as needed
		const bigTextY = bigTextSize + 20; // Adjust the Y position as needed

		// Draw the big text "WillisRH"
		ctx.fillText("express-autopost-ig", bigTextX, bigTextY);

		// Set font size and calculate text position for center
		const fontSize = 30;
		ctx.font = `${fontSize}px Arial`;
		ctx.fillStyle = "black";
		ctx.textAlign = "center";

		const textX = canvasWidth / 2;
		const textY = canvasHeight / 2;

		// Draw text on the canvas
		ctx.fillText(`From: ${from}`, textX, textY - fontSize);
		ctx.fillText(`To: ${to}`, textX, textY);
		ctx.fillText(`Message: ${message}`, textX, textY + fontSize);

		// Convert the canvas to a buffer
		const buffer = canvas.toBuffer("image/jpeg");

		// Save the buffer to a file (as JPEG)
		const outputFilePath = path.join(__dirname, "public/images", `${id}.jpg`);
		fs.writeFileSync(outputFilePath, buffer);

		// Send the image URL as a response
		const imageUrl = id;
		postToInsta(imageUrl);

		// timeout logic
		setTimeout(() => {
			const imagePath = path.join(
				__dirname,
				"public/images",
				`${imageUrl}.jpg`
			);
			fs.unlink(imagePath, (err) => {
				if (err) {
					console.error("Error deleting image file:", err);
				} else {
					console.log("Image file deleted successfully");
				}
			});
		}, 10000);
		//     const response = await confess.find()
		//     if (req.header("Accept").includes("text/html")) {
		// return res.render("approval", {
		//     confesses: response,
		//     msg: "Berhasil post image ke instagram!"
		// })

		//     } else {
		//         return res.status(200).json({
		//             msg: "Confess berhasil diupload!",
		//             url: imageUrl
		//         });
		//     }

		return res.redirect("/delete-confess/" + id);
	} catch (e) {
		console.log(e);
		return res.redirect("/admin/approval");
	} // anjg di post
});

routes.get("/login", async (req, res) => {
	res.render("login");
});

routes.post("/login", async (req, res) => {
	const { username, password } = req.body;
	const cookies = new Cookies(req, res);
	const token = jwt.sign(
		{
			username,
			password,
		},
		process.env.SECRET_KEY
	);

	if (username == admin_user && password == admin_pass) {
		const time = new Date();
		time.setTime(time.getTime() + 30 * 60 * 1000);

		cookies.set("token", token, { expires: time });
		console.log(token);
		return res.redirect("/admin/approval/");
	} else {
		return res.redirect("/login");
	}
});

routes.get("/admin/approval", beforeLoad, async (req, res) => {
	const response = await confess.find();

	return res.render("approval", {
		confesses: response,
	});
});

routes.get("/delete-confess/:id", async (req, res) => {
	// delete confess from database
	const { id } = req.params;

	try {
		await confess.findOneAndDelete({ id: id }); //restart ye ye lu ga pake nodemon?  kok ga kedelete yakinstallnya --save-dev ga
		return res.redirect("/admin/approval");
	} catch (error) {
		console.error(error);
		return res.redirect("/admin/approval");
	}
});

// routes.post("/new-data", async (req, res) => {
//     const { from, to, message } = req.body;

//     console.log(`from: ${from}, to: ${to}, msg: ${message}`);

//     if (from == undefined || to == undefined || message == undefined) {
//         return res.json({ msg: "ada yang gaberes" });
//     }

//     try {
//         const randomNum = Math.floor(Math.random() * 99999);
//         const time = Date.now();
//         const today = new Date(time);
//         const todayString = today.toDateString();
//         await confess.create({
//             id: randomNum,
//             from: from,
//             to: to,
//             message: message,
//             createdAt: todayString,
//         });

//         // Create a canvas with specified dimensions
//         const canvasWidth = 1080;
//         const canvasHeight = 1080;
//         const canvas = createCanvas(canvasWidth, canvasHeight);
//         const ctx = canvas.getContext("2d");

//         // Load the background image onto the canvas
//         const backgroundImage = await loadImage('./public/images/bg.jpg');
//         ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

//         // Set font size and calculate text position for center
//         const fontSize = 30;
//         ctx.font = `${fontSize}px Arial`;
//         ctx.fillStyle = "black";
//         ctx.textAlign = "center";

//         const textX = canvasWidth / 2;
//         const textY = canvasHeight / 2;

// //         const textWidth = ctx.measureText(`Message: ${message}`).width + 40; // Adding padding
// //         const textHeight = fontSize * 3;

// //         ctx.fillStyle = "white";
// // ctx.fillRect(textX - textWidth / 2, textY - textHeight / 2, textWidth, textHeight);

// // Draw text on the canvas
// ctx.fillStyle = "black";
// ctx.fillText(`From: ${from}`, textX, textY - fontSize);
// ctx.fillText(`To: ${to}`, textX, textY);
// ctx.fillText(`Message: ${message}`, textX, textY + fontSize);

//         // Convert the canvas to a buffer
//         const buffer = canvas.toBuffer("image/jpeg");

//         // Save the buffer to a file (as JPEG)
//         const outputFilePath = path.join(
//             __dirname,
//             "public/images",
//             `${randomNum}.jpg`
//         );
//         fs.writeFileSync(outputFilePath, buffer);

//         // Send the image URL as a response
//         const imageUrl = `${randomNum}`;
//         postToInsta(imageUrl);

//         return res.status(200).json({
//             msg: "Confess berhasil diupload!",
//             url: imageUrl
//         });
//     } catch (e) {
//         console.log(e);
//         return res.status(201).json({
//             msg: "Confess gagal di upload :c, coba hubungi willis dan fatihul",
//         });
//     }
// });

// routes.post("/web-new-data", async (req, res) => {
//     const { from, to, message } = req.body;

//     console.log(`from: ${from}, to: ${to}, msg: ${message}`);

//     if (from == undefined || to == undefined || message == undefined) {
//         return res.json({ msg: "ada yang gaberes" });
//     }

//     try {
//         const randomNum = Math.floor(Math.random() * 99999);
//         const time = Date.now();
//         const today = new Date(time);
//         const todayString = today.toDateString();
//         await confess.create({
//             id: randomNum,
//             from: from,
//             to: to,
//             message: message,
//             createdAt: todayString,
//         });

//     // Create a canvas with specified dimensions
//     const canvasWidth = 1080;
//     const canvasHeight = 1080;
//     const canvas = createCanvas(canvasWidth, canvasHeight);
//     const ctx = canvas.getContext("2d");

//     // Fill canvas with white background
//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     // Set font size and calculate text position for center
//     const fontSize = 30;
//     ctx.font = `${fontSize}px Arial`;
//     ctx.fillStyle = "black";
//     ctx.textAlign = "center";

//     const textX = canvasWidth / 2;
//     const textY = canvasHeight / 2;

//     // Draw text on the canvas
//     ctx.fillText(`From: ${from}`, textX, textY - fontSize);
//     ctx.fillText(`To: ${to}`, textX, textY);
//     ctx.fillText(`Message: ${message}`, textX, textY + fontSize);

//     // Convert the canvas to a buffer
//     const buffer = canvas.toBuffer("image/jpeg");

//     // Save the buffer to a file (as JPEG)
//     const outputFilePath = path.join(
//         __dirname,
//         "public/images",
//         `${randomNum}.jpg`
//     );
//     fs.writeFileSync(outputFilePath, buffer);

//     // Send the image URL as a response
//     const imageUrl = `${randomNum}`;
//     postToInsta(imageUrl);
//     res.redirect('/confess/success');
//     //     return res.status(200).json({
//     //     msg: "Confess berhasil diupload!",
//     //     url: imageUrl
//     // });
//     } catch (e) {
//         console.log(e);
//         res.redirect('/confess/failed');
//         // return res.status(201).json({
//         //     msg: "Confess gagal di upload :c, coba hubungi willis dan fatihul",
//         // });
//     }
// });

// routes.post("/apacoba", async (req, res) => {
//     const { from, to, message } = req.body;
//     const randomNum = Math.floor(Math.random() * 99999);

//     // Create a canvas with specified dimensions
//     const canvasWidth = 1080;
//     const canvasHeight = 1080;
//     const canvas = createCanvas(canvasWidth, canvasHeight);
//     const ctx = canvas.getContext("2d");

//     // Fill canvas with white background
//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     // Set font size and calculate text position for center
//     const fontSize = 30;
//     ctx.font = `${fontSize}px Arial`;
//     ctx.fillStyle = "black";
//     ctx.textAlign = "center";

//     const textX = canvasWidth / 2;
//     const textY = canvasHeight / 2;

//     // Draw text on the canvas
//     ctx.fillText(`From: ${from}`, textX, textY - fontSize);
//     ctx.fillText(`To: ${to}`, textX, textY);
//     ctx.fillText(`Message: ${message}`, textX, textY + fontSize);

//     // Convert the canvas to a buffer
//     const buffer = canvas.toBuffer("image/jpeg");

//     // Save the buffer to a file (as JPEG)
//     const outputFilePath = path.join(
//         __dirname,
//         "public/images",
//         `${randomNum}.jpg`
//     );
//     fs.writeFileSync(outputFilePath, buffer);

//     // Send the image URL as a response
//     const imageUrl = `${randomNum}`;
//     res.status(200).json({ url: imageUrl });
// });

// confess website
routes.get("/", (req, res) => {
	res.redirect("/confess")
});

routes.get("/confess", (req, res) => {
	res.render("confess");
});

routes.get("/confess/success", (req, res) => {
	res.render("success");
});

routes.get("/confess/failed", (req, res) => {
	res.render("failed");
});

module.exports = routes;

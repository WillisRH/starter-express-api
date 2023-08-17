require("dotenv").config();
const { IgApiClient } = require("instagram-private-api");
const { get } = require("request-promise");
const { promisify } = require("util");
const { readFile } = require("fs");
const readFileAsync = promisify(readFile);

async function postToInsta(link) {
	try {
		const ig = new IgApiClient();
		ig.state.generateDevice(process.env.IG_USERNAME + "a");
		await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

		// const imageBuffer = await get({
		//     url: `http://localhost:2000/${link}`,
		//     encoding: null,
		// });

		console.log(`./public/images/${link}`);
		// if(capt) {
		// 	await ig.publish.photo({
		// 		file: await readFileAsync(`./public/images/${link}.jpg`),
		// 		caption: `${capt}\n\n#${link}`,
		// 	});
		// }

		await ig.publish.photo({
			file: await readFileAsync(`./public/images/${link}.jpg`),
			caption: `Ada yang confess nihh, yuk kepoin!\n\n#${link}`,
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = postToInsta;

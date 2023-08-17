const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios").default;
const postToInsta = require("./instagram.js");

const client = new Client({ authStrategy: new LocalAuth() });
client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
	console.log("ready banh");
});

client.on("message_create", async (msg) => {
	const chat = msg.getChat();
	const cmd = msg.body.slice(1);

	if (msg.body.startsWith("!")) {
		if (cmd.startsWith("confess")) {
			const string = cmd.split(" ");
			const from = string.slice(1, 2).join(" ");
			const to = string.slice(2, 3).join(" ");
			const message = string.slice(3).join(" ");
			console.log(`confess, from : ${from}, to : ${to}, message : ${message}`);

			msg.reply(`Confess\nFrom : ${from}\nTo : ${to}\nMessage : ${message}`);

			const res = await axios.post(`http://localhost:2000/new-confess`, {
				from,
				to,
				message,
			});

			console.log(res.data.url);
			console.log(res.status);
			msg.reply(res.data.msg);
		}
	}
});

module.exports = client;

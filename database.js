const mongoose = require("mongoose");

const checkDB = () => {
	try {
		mongoose.connect(process.env.DATABASE_MONGODB, { dbName: "wlsproject" });
		console.log("connected to db");
	} catch (err) {
		throw err;
		console.log(`failed to connect to db : ${err}`);
	}
};

// schema
const schema = mongoose.Schema;
const confessSchema = new schema({
	id: {
		type: Number,
	},
	from: {
		type: String,
	},
	to: {
		type: String,
	},
	message: {
		type: String,
	},
	createdAt: {
		type: String,
	},
});

const confess = mongoose.model("confess", confessSchema);

module.exports = {
	confess,
	checkDB,
};

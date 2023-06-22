const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { Client, MessageMedia, LegacySessionAuth, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
// const admin = require("firebase-admin");

// // Initialize the Firebase Admin SDK
// const serviceAccount = require("./antiexploit-5db60-firebase-adminsdk-hfu31-9da9562d59.json"); // Replace with the path to your service account key JSON file
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// Create the "downloaded" folder if it doesn't exist
const downloadedFolder = path.join(__dirname, "downloaded");
if (!fs.existsSync(downloadedFolder)) {
  fs.mkdirSync(downloadedFolder);
  console.log(`Created ${downloadedFolder} directory \n`);
}

// WhatsApp Bot Setup
const bot = new Client({
  authStrategy: new LocalAuth()
});
// const SESSION_FILE_PATH = './session.json';

// // Load the session data if it has been previously saved
// let sessionData;
// if(fs.existsSync(SESSION_FILE_PATH)) {
//     sessionData = require(SESSION_FILE_PATH);
// }

// // Use the saved values
// const bot = new Client({
//     session: sessionData,
//     authOptions: {
//         clientOptions: {
//             sessionId: 'session',
//             authTimeout: 60000,
//         },
//         auth: LocalAuth,
//     },
// });

// // Save session values to the file upon successful auth
// bot.on('authenticated', (session) => {
//     sessionData = session;
//     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
//         if (err) {
//             console.error(err);
//         }
//     });
// });
bot.on("qr", (qr) => {
  qrcode.generate(qr, { small: true }); // Display QR code in the console
});


var waconnected;
bot.on("ready", () => {
  console.log("WhatsApp Bot is ready! \n");
  waconnected = true;
});

// bot.on("message_create", async (message) => {
//   if (message.hasMedia) {
//     const media = await message.downloadMedia();

//     // Save the media file to the "downloaded" folder
//     const filePath = path.join(downloadedFolder, `${Date.now()}.${media.mimetype.split("/")[1]}`);
//     fs.writeFileSync(filePath, media.data);

//     console.log(`Media saved to ${filePath}`);
//   }
// });


const recreateFolder = () => {
  fs.rmdirSync(downloadedFolder, { recursive: true });
  fs.mkdirSync(downloadedFolder);
  console.log("Deleted and recreated the 'downloaded' folder \n" );
};
// Schedule folder recreation every 10 minutes (600000 milliseconds)
setInterval(recreateFolder, 3600000);
app.use("/downloaded", express.static(downloadedFolder));
bot.on("message_create", async (message) => {
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    if (media && media.mimetype && media.mimetype.startsWith("image/")) {
      const contact = await message.getContact();
      const name = contact.pushname;
      const contactn = contact.number;

      // Convert the media data to a Buffer
      const buff = Buffer.from(media.data, 'base64');
      // Save the Buffer to a file with .jpg extension
      const filePath = path.join(downloadedFolder, `${contactn}_${name}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, buff);

      console.log(`Media saved to ${filePath} [${new Date().toLocaleTimeString()}] \n`);

    } else {
      return console.log(media.mimetype);
    }
  }


});


app.get("/gallery", (req, res) => {
  // Read all files in the "downloaded" folder
  fs.readdir(downloadedFolder, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred. \n");
    } else {
      // Filter JPEG files
      const jpegFiles = files.filter((file) => path.extname(file) === ".jpg");

      // Render the "gallery" EJS template and pass the JPEG file names as data
      res.render("gallery", { files: jpegFiles, connected: waconnected });
    }
  });
});

const { performance } = require('perf_hooks');

function getCircleColor(ping) {
  if (ping <= 50) {
    return 'green';
  } else if (ping <= 100) {
    return 'yellow';
  } else {
    return 'red';
  }
}

function measurePing() {
  const startTime = performance.now();
  // Perform an operation that takes some time
  const endTime = performance.now();
  const ping = endTime - startTime;
  return ping;
}
app.get('/ping', (req, res) => {
  res.json({ timestamp: Date.now() });
});

app.get('/pings', (req, res) => {
  const ping = measurePing();

  console.log(ping)
  // Send the ping duration to the EJS template
  res.render('status', { ping: measurePing, getCircleColor: getCircleColor });
});


app.get('/remove-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadedFolder, filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Remove the file
    fs.unlinkSync(filePath);
    console.log(`File ${filename} has been removed. \n`);
    res.redirect('/gallery'); // Redirect to the gallery page
  } else {
    console.log(`File ${filename} does not exist. \n`);
    res.redirect('/gallery'); // Redirect to the gallery page
  }
});


// Express route to serve the downloaded media file
// app.get("/media/:fileName", (req, res) => {
//   const fileName = req.params.fileName;
//   const filePath = path.join(downloadedFolder, fileName);

//   if (fs.existsSync(filePath)) {
//     res.sendFile(filePath);
//   } else {
//     res.status(404).send("File not found");
//   }
// });

// Start the WhatsApp bot
bot.initialize();

app.listen(7111, () => {
  console.log("Server listening on port 7111");
});

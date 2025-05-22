const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const port = 3000;

app.use(bodyParser.text());
app.use(express.static("public")); // Serves static files from 'public'

// Arduino board config
const cli = "arduino-cli";
const fqbn = "esp32:esp32:esp32dev"; // Change if your board is different

function getEsp32Port(callback) {
  exec(`${cli} board list`, (err, stdout, stderr) => {
    if (err) {
      console.error("Error detecting board:", stderr);
      return callback(null);
    }
    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.includes("esp32")) {
        const match = line.match(/^([^\s]+)/);
        if (match) return callback(match[1]);
      }
    }
    callback(null);
  });
}

app.post("/upload", (req, res) => {
  const code = req.body;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  const sketchPath = "./sketches/user_code/user_code.ino";
  fs.mkdirSync("./sketches/user_code", { recursive: true });
  fs.writeFileSync(sketchPath, code);

  exec(`${cli} compile --fqbn ${fqbn} sketches/user_code`, (err, stdout, stderr) => {
    if (err) {
      console.error("Compilation error:", stderr);
      return res.status(500).send(`Compilation failed:\n${stderr}`);
    }

    getEsp32Port((detectedPort) => {
      if (!detectedPort) {
        return res.status(500).send("ESP32 not detected");
      }

      console.log(`Detected ESP32 on port ${detectedPort}`);
      exec(`${cli} upload -p ${detectedPort} --fqbn ${fqbn} sketches/user_code`, (err2, stdout2, stderr2) => {
        if (err2) {
          console.error("Upload error:", stderr2);
          return res.status(500).send(`Upload failed:\n${stderr2}`);
        }

        res.send("Upload successful!");
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

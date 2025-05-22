const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

app.post("/upload", (req, res) => {
  const code = req.body.code;
  const sketchDir = path.join(__dirname, "sketches", "user_code");
  const inoPath = path.join(sketchDir, "user_code.ino");

  fs.mkdirSync(sketchDir, { recursive: true });
  fs.writeFileSync(inoPath, code);

  const cli = path.join(__dirname, "bin", "arduino-cli");
  const boardFQBN = "esp32:esp32:esp32";
  const port = "/dev/ttyUSB0"; // Adjust if needed

  const compileCmd = `${cli} compile --fqbn ${boardFQBN} ${sketchDir}`;
  const uploadCmd = `${cli} upload -p ${port} --fqbn ${boardFQBN} ${sketchDir}`;

  exec(compileCmd, (err, stdout, stderr) => {
    if (err) {
      res.send("❌ Compilation failed:\n" + stderr);
      return;
    }
    exec(uploadCmd, (err2, stdout2, stderr2) => {
      if (err2) {
        res.send("❌ Upload failed:\n" + stderr2);
      } else {
        res.send("✅ Upload successful:\n" + stdout2);
      }
    });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

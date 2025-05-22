let port;
let reader;
let writer;
let editor;

require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: `void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  Serial.println("Hello ESP32");\n  delay(1000);\n}`,
    language: "cpp",
    theme: "vs-dark"
  });
});

async function connectSerial() {
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: parseInt(document.getElementById('baudrate').value) });
  reader = port.readable.getReader();
  document.getElementById('output').textContent = "✔️ Connected to ESP32\n";
  readLoop();
}

async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = new TextDecoder().decode(value);
    document.getElementById('output').textContent += text;
  }
}

async function sendData() {
  writer = port.writable.getWriter();
  const data = new TextEncoder().encode("Hello from browser!\n");
  await writer.write(data);
  writer.releaseLock();
}

async function uploadCode() {
  const code = editor.getValue();
  const res = await fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const result = await res.text();
  document.getElementById("output").textContent += `\n\n${result}\n`;
}

let port;
let reader;
let output = document.getElementById('output');

// Load Monaco Editor
require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
  window.editor = monaco.editor.create(document.getElementById('editor'), {
    value: `void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  Serial.println("Hello from ESP32!");\n  delay(1000);\n}`,
    language: 'cpp',
    theme: 'vs-dark',
    automaticLayout: true
  });
});

document.getElementById('connect').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    const baudRate = parseInt(document.getElementById('baudRate').value);
    await port.open({ baudRate });

    // Read from serial
    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    output.innerText += "✅ Connected to ESP32\n";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      output.innerText += value;
      output.scrollTop = output.scrollHeight;
    }
  } catch (err) {
    output.innerText += `❌ Error: ${err.message}\n`;
  }
});

document.getElementById('send').addEventListener('click', async () => {
  if (!port || !port.writable) {
    output.innerText += "⚠️ Not connected to ESP32\n";
    return;
  }

  const code = window.editor.getValue();
  const encoder = new TextEncoderStream();
  const writableStreamClosed = encoder.readable.pipeTo(port.writable);
  const writer = encoder.writable.getWriter();
  await writer.write(code);
  writer.releaseLock();

  output.innerText += "📤 Code sent to ESP32 (serial)\n";
});

// public/script.js
let port;
let writer;

document.getElementById('connect-btn').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort(); // request user to pick port
    await port.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    writer = port.writable.getWriter();
    document.getElementById('send-btn').disabled = false;

    document.getElementById('output').value += '✅ Connected to ESP32\n';

    // Read incoming data
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      document.getElementById('output').value += value;
    }
  } catch (err) {
    console.error(err);
    alert('Connection failed: ' + err);
  }
});

document.getElementById('send-btn').addEventListener('click', async () => {
  const data = "Hello from Web Serial!\n";
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(data));
  document.getElementById('output').value += '📤 Sent: ' + data;
});

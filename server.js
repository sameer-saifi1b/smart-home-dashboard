const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files (index.html, script.js, style.css)
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// -------------------- MONGO DB CONNECTION --------------------
mongoose.connect('mongodb://127.0.0.1:27017/smartHome', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// -------------------- SCHEMA & MODEL --------------------
const deviceSchema = new mongoose.Schema({
  lightOn: Boolean,
  temperature: Number
});

const Device = mongoose.model('Device', deviceSchema);

// -------------------- MQTT CONNECTION --------------------
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => {
  console.log('✅ MQTT Connected to broker.hivemq.com');
  mqttClient.subscribe('home/livingroom/light');
  mqttClient.subscribe('home/livingroom/temperature');
});

mqttClient.on('message', async (topic, message) => {
  let devices = await Device.findOne();
  if (!devices) {
    devices = new Device({ lightOn: true, temperature: 22 });
  }

  if (topic === 'home/livingroom/light') {
    devices.lightOn = message.toString() === '1';
  }

  if (topic === 'home/livingroom/temperature') {
    let tempValue = parseInt(message.toString(), 10);
    if (!isNaN(tempValue)) {
      devices.temperature = tempValue;
    } else {
      console.warn("⚠️ Invalid temperature received:", message.toString());
    }
  }

  await devices.save();
  io.emit('deviceStatus', devices);
});

// -------------------- SOCKET.IO LOGIC --------------------
io.on('connection', async (socket) => {
  console.log('📡 New client connected:', socket.id);

  let devices = await Device.findOne();
  if (!devices) {
    devices = new Device({ lightOn: true, temperature: 22 });
    await devices.save();
  }

  socket.emit('deviceStatus', devices);

  socket.on('updateLight', async (newLightStatus) => {
    mqttClient.publish('home/livingroom/light', newLightStatus ? '1' : '0');
  });

  socket.on('updateTemperature', async (newTemp) => {
    if (!isNaN(parseInt(newTemp, 10))) {
      mqttClient.publish('home/livingroom/temperature', String(newTemp));
    } else {
      console.warn("⚠️ Tried to send invalid temperature:", newTemp);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// -------------------- START SERVER --------------------
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

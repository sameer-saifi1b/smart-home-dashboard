const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

let lightOn = true;
let temp = 22; // Initial temperature

client.on('connect', () => {
  console.log("✅ Virtual Device Connected to MQTT");
  client.subscribe('home/livingroom/light');
  client.subscribe('home/livingroom/temperature');

  // Har 10 second me random temperature publish karo
  setInterval(() => {
    temp = Math.floor(Math.random() * (30 - 18 + 1)) + 18; // 18°C to 30°C range
    client.publish('home/livingroom/temperature', String(temp));
    console.log(`🌡️ Auto Temperature Sent: ${temp}°C`);
  }, 10000);
});

client.on('message', (topic, message) => {
  if (topic === 'home/livingroom/light') {
    lightOn = message.toString() === '1';
    console.log(`💡 Light Status: ${lightOn ? 'ON' : 'OFF'}`);
  }

  if (topic === 'home/livingroom/temperature') {
    console.log(`📥 Dashboard Requested Temperature Change: ${message.toString()}°C`);
  }
});

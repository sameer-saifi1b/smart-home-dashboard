// Connect to backend socket.io server
const socket = io('http://localhost:3000');

let lightOn = true;
let temp = 22; // current temperature

// HTML elements
const lightStatusEl = document.getElementById('light-status');
const tempStatusEl = document.getElementById('thermo-status') || document.getElementById('temperatureValue');
const tempInputEl = document.getElementById('temperatureInput');
const setTempBtn = document.getElementById('setTemperature');

// Update Light UI
function updateLightStatusUI() {
  const status = document.getElementById('light-status');
  const bulb = document.getElementById('light-bulb');

  status.innerText = lightOn ? 'ON' : 'OFF';
  status.style.color = lightOn ? 'green' : 'red';
  bulb.src = lightOn ? 'bulb-on.png' : 'bulb-off.png';
  bulb.className = lightOn ? 'light-on' : 'light-off';
}


// Smooth temperature animation
function animateTemperature(oldTemp, newTemp, duration = 500) {
  let startTime = null;
  const circle = document.getElementById('temp-progress');
  const maxTemp = 40; // gauge max
  const circumference = 2 * Math.PI * 50; // r = 50

  function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const animatedTemp = Math.round(oldTemp + (newTemp - oldTemp) * progress);

      document.getElementById('thermo-status').textContent = `${animatedTemp}°C`;

      // Update gauge fill
      const percent = animatedTemp / maxTemp;
      circle.style.strokeDashoffset = circumference - percent * circumference;

      if (progress < 1) {
          requestAnimationFrame(step);
      }
  }

  requestAnimationFrame(step);
}


// Toggle Light
function toggleLight() {
    lightOn = !lightOn;
    socket.emit('updateLight', lightOn);
}

// Increase/Decrease temperature
function increaseTemp() {
    temp++;
    socket.emit('updateTemperature', temp);
}

function decreaseTemp() {
    temp--;
    socket.emit('updateTemperature', temp);
}

// Manual set temperature
if (setTempBtn) {
    setTempBtn.addEventListener("click", () => {
        const newTemp = parseInt(tempInputEl.value, 10);
        if (!isNaN(newTemp)) {
            socket.emit("updateTemperature", newTemp);
        } else {
            alert("⚠️ Please enter a valid number");
        }
    });
}

// Listen for updates from server
socket.on('deviceStatus', (devices) => {
    lightOn = devices.lightOn;
    updateLightStatusUI();

    animateTemperature(temp, devices.temperature);
    temp = devices.temperature;
});

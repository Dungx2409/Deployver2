const mqtt = require('mqtt');
const { db, ref, push } = require('./firebase');
let wsClients = [];
let mqttClient = null; // Lưu client để sử dụng cho publish

function setupMQTT(wsList) {
  wsClients = wsList;
  mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

  let isDeviceOnline = false;
  let offlineTimeout = null;
  const OFFLINE_INTERVAL = 30000; // 30 giây

  function notifyStatus(status) {
    wsClients.forEach(ws => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ system_status: status }));
    });
  }

  mqttClient.on('connect', () => {
    mqttClient.subscribe('/sensor/data');
    console.log('MQTT connected and subscribed to /sensor/data');
  });

  mqttClient.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
    console.log("MQTT Received:", data);
    // Lưu vào Firebase
    push(ref(db, 'data_sensor'), data);

    // Nếu lần đầu nhận dữ liệu, gửi trạng thái online
    if (!isDeviceOnline) {
      isDeviceOnline = true;
      notifyStatus('online');
    }

    // Reset bộ đếm offline mỗi lần nhận dữ liệu
    if (offlineTimeout) clearTimeout(offlineTimeout);
    offlineTimeout = setTimeout(() => {
      isDeviceOnline = false;
      notifyStatus('offline');
    }, OFFLINE_INTERVAL);

    // Gửi dữ liệu sensor như cũ
    wsClients.forEach(ws => {
      if (ws.readyState === 1) ws.send(JSON.stringify(data));
    });
  });
}

// Hàm để gửi lệnh điều khiển servo
function publishServoControl(value) {
  if (mqttClient && mqttClient.connected) {
    const controlMessage = {
      servo: value,
      timestamp: new Date().toISOString()
    };
    
    mqttClient.publish('/control/servo', JSON.stringify(controlMessage));
    console.log(`Published servo control: ${value} to /control/servo`);
  } else {
    console.error('MQTT client not connected, cannot send servo control');
  }
}

module.exports = { setupMQTT, publishServoControl };

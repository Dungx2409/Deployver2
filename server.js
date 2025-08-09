const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { setupWebSocket } = require('./websocket');
const { setupMQTT, publishServoControl } = require('./mqttHandler');
const { db, ref, get, query, orderByChild, startAt, endAt } = require('./firebase');

const app = express();
const server = http.createServer(app);

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json()); // Parse 50JSON body

// Setup WebSocket & MQTT
const wsClients = setupWebSocket(server);
setupMQTT(wsClients);

// API endpoint điều khiển servo
app.post('/control/servo', (req, res) => {
    try {
        const { value } = req.body;
        if (value !== 0 && value !== 1) {
            return res.status(400).json({ error: 'Giá trị phải là 0 hoặc 1' });
        }
        publishServoControl(value);
        console.log(`Servo control: ${value}`);
        res.json({ success: true, message: `Đã gửi lệnh servo: ${value}` });
    } catch (error) {
        console.error('Error controlling servo:', error);
        res.status(500).json({ error: 'Lỗi server khi điều khiển servo' });
    }
});

// API lấy dữ liệu cảm biến
app.get('/data_sensor', async (req, res) => {
    try {
        const { from, to } = req.query;
        console.log(`Fetching data from ${from} to ${to}`);

        const q = query(
            ref(db, 'data_sensor'),
            orderByChild('timestamp'),
            startAt(from + " 00:00:00"),
            endAt(to + " 23:59:59")
        );

        const snap = await get(q);
        const result = [];

        snap.forEach(child => {
            result.push(child.val());
        });

        result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const limitedResult = result.slice(-20);

        console.log(`Found ${limitedResult.length} records (limited to 20 latest points)`);
        res.json(limitedResult);

    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Lắng nghe cổng Render cung cấp
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

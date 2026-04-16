const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.static(__dirname));

// Route for Mobile Scanner
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'Mobile', 'index.html'));
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Receive barcode from Mobile
    socket.on('scan_barcode', (data) => {
        console.log('Barcode received:', data.barcode);
        // Relay to all other connected clients (PC POS)
        socket.broadcast.emit('remote_scan', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Get Local IP
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
};

const PORT = process.env.PORT || 3000;
const IP = getLocalIp();

server.listen(PORT, () => {
    console.log('\n------------------------------------------------');
    console.log('🛍️  POSBIT System is running!');
    console.log(`💻 PC POS: http://localhost:${PORT}`);
    console.log(`📱 Mobile Scanner: http://${IP}:${PORT}/mobile`);
    console.log('------------------------------------------------\n');
});

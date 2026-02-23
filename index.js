const express = require("express"); // Added missing import
const http = require("http");
const { Server } = require("socket.io"); // Changed to require()
const { ExpressPeerServer } = require("peer"); // Changed to ExpressPeerServer

const PORT = process.env.PORT || 9000;

const app = express();
const server = http.createServer(app);

// --- SOCKET.IO SERVER ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allows frontend to connect
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // Extract the real IP (Render uses 'x-forwarded-for')
  const clientIP =
    socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress;

  console.log(`[Socket] Connected: ${socket.id} | IP: ${clientIP}`);

  // Automatically join a room named after the public IP address
  socket.join(clientIP);

  // When a user initializes the radar page, they announce themselves
  socket.on("join-radar", (userData) => {
    socket.userData = userData;
    socket.to(clientIP).emit("peer-joined", userData);
  });

  // MOVED OUTSIDE: Listen for disconnects properly
  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id} | IP: ${clientIP}`);
    if (socket.userData) {
      socket.to(clientIP).emit("peer-left", socket.userData.peerId);
    }
  });
});

// --- PEER JS WEBRTC SIGNALLING SERVER ---

// Piggyback onto the existing HTTP server to avoid port conflicts
const peerServer = ExpressPeerServer(server, {
  path: "/myapp",
});

// Attach PeerJS to the Express app
app.use("/", peerServer);

peerServer.on("connection", (client) => {
  console.log(`[+] Peer connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client) => {
  console.log(`[-] Peer disconnected: ${client.getId()}`);
});

// --- START UNIFIED SERVER ---
server.listen(PORT, () => {
  console.log(`QuickDrop Unified Signaling Server running on port ${PORT}`);
});

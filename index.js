const { PeerServer } = require("peer");

const PORT = process.env.PORT || 9000;

const customServer = PeerServer({
  port: PORT,
  path: "/myapp",
});

customServer.on("connection", (client) => {
  console.log(`[+] Peer connected: ${client.getId()}`);
});

customServer.on("disconnect", (client) => {
  console.log(`[-] Peer disconnected: ${client.getId()}`);
});

console.log(`QuickDrop Signaling Server running on port ${PORT}`);

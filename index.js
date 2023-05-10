const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const usuariosConectados = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado");

  socket.on("unirse-al-chat", (nombre) => {
    console.log(`El usuario ${nombre} se ha unido al chat`);
    usuariosConectados[socket.id] = nombre;

    socket.emit("mensaje", {
      autor: "Servidor",
      mensaje: `¡Bienvenido al chat, ${nombre}!`
    });
    socket.broadcast.emit("mensaje", {
      autor: "Servidor",
      mensaje: `${nombre} se ha unido al chat`
    });
  });

  socket.on("enviar-mensaje", (mensaje) => {
    console.log(`El usuario ${usuariosConectados[socket.id]} envió un mensaje: ${mensaje}`);

    io.emit("mensaje", {
      autor: usuariosConectados[socket.id],
      mensaje: mensaje
    });
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado");

    const nombre = usuariosConectados[socket.id];

    socket.broadcast.emit("mensaje", {
      autor: "Servidor",
      mensaje: `${nombre} se ha desconectado`
    });

    delete usuariosConectados[socket.id];
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(3000, () => {
  console.log("Servidor iniciado en el puerto 3000");
});

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const usuariosConectados = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado");

  fs.readFile("users.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    let connectedUsers;

    try {
      connectedUsers = JSON.parse(data);
    } catch (error) {
      console.error("Error al analizar los datos JSON:", error);
      // Maneja el error de análisis como consideres adecuado
    }
        usuariosConectados[socket.id] = connectedUsers[socket.id] || "";

    socket.emit("mensaje", {
      autor: "Servidor",
      mensaje: `¡Bienvenido al chat, ${usuariosConectados[socket.id]}!`
    });
    socket.broadcast.emit("mensaje", {
      autor: "Servidor",
      mensaje: `${usuariosConectados[socket.id]} se ha unido al chat`
    });

    io.emit("usuarios-conectados", Object.values(connectedUsers));
  });

  socket.on("unirse-al-chat", (nombre) => {
    console.log(`El usuario ${nombre} se ha unido al chat`);
    usuariosConectados[socket.id] = nombre;

    fs.readFile("users.json", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const connectedUsers = JSON.parse(data);
      connectedUsers[socket.id] = nombre;

      fs.writeFile("users.json", JSON.stringify(connectedUsers), (err) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log("El archivo users.json se ha actualizado");
      });
    });

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

    fs.readFile("users.json", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const connectedUsers = JSON.parse(data);
      delete connectedUsers[socket.id];

      fs.writeFile("users.json", JSON.stringify(connectedUsers), (err) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log("El archivo users.json se ha actualizado");
      });
    });
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(3000, () => {
  console.log("Servidor iniciado en el puerto 3000");
});

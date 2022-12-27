const express = require('express');
const http = require('http');
const app = express();
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const { initialize } = require('./routes');

app.use(express.static('public'));

initialize(app, io);

server.listen(3000);
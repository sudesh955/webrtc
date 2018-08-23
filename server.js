#!/usr/bin/env node

const
	path = require('path'),
	express = require('express');


const app = express();

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const server = require('http').createServer(app);
const io = require('socket.io')(server);
server.listen(3000);

io.on('connection', socket => {
	socket.on('send-event', sendEvent);
	socket.on('disconnect', disconnect);
	io.sockets.clients((error, clients) => {
		if (error)
			throw error;
		socket.emit('online-clients', clients.filter(client => client !== socket.id));
		for (let i = clients.length - 1; i >= 0; i--)
			socket.to(clients[i]).emit('add-online-client', socket.id);
	});
});

function sendEvent(to, event, ...args) {
	this.to(to).emit(event, this.id, ...args);
}

function disconnect() {
	io.sockets.emit('remove-online-client', this.id);
}
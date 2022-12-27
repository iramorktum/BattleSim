const Actions = require('./functions/actions');
let reg;

function initialize(app, io) {
    app.get('/', (request, responce) => {
        responce.sendFile(__dirname + '/routes/battle.html');
        io.once('connection', async (socket) => {
            socket.on('initialize', async (id) => {
                io.sockets.emit('initialize', await Actions.init(id));
            });
            socket.on('moving', async (id, key) => {
                io.sockets.emit('moving', await Actions.move(id, key));
            });
            socket.on('rotating', async (id, key) => {
                io.sockets.emit('rotating', await Actions.rotate(id, key));
            });
            socket.on('stop rotating', async (id) => {
                io.sockets.emit('stop rotating', await Actions.stopRotate(id));
            });
            socket.on('newRotating', async (id) => {
                io.sockets.emit('rotating', await Actions.newRotate(id));
            });
            socket.on('cooldown', async (id, key, grade) => {
                await Actions.cooldown(id, key, grade);
            });
            socket.on('attack', async (id) => {
                io.sockets.emit('attack', await Actions.attack(id));
            });
            socket.on('addCat', async () => {
                io.sockets.emit('addCat', await Actions.addCat());
            });
        });
    });
    reg = setInterval(async () => {
        io.sockets.emit('regenerate', await Actions.regenerate());
    }, 10000);
};

module.exports = { initialize };
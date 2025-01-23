import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5176", 
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    },
});

const PORT = process.env.PORT || 3000;

const rooms = {}; // Stores room data: { roomId: { users: [], code: '' } }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User joins a room
    socket.on('join', ({ roomId, username }, callback) => {
        if (!roomId || !username) {
            return callback({ status: 'error', message: 'roomId and username are required.' });
        }

        if (!rooms[roomId]) {
            rooms[roomId] = { users: [], code: '' }; // Initialize room if not exists
        }

        
        const isUserInRoom = rooms[roomId].users.some((user) => user.id === socket.id);
        if (isUserInRoom) {
            return callback({ status: 'error', message: 'User already in the room.' });
        }

        // Add user to the room
        rooms[roomId].users.push({ id: socket.id, username });
        socket.join(roomId);

        // Notify other users in the room
        socket.to(roomId).emit('userConnected', { id: socket.id, username });

        // Send current room state to the new user
        callback({
            status: 'success',
            users: rooms[roomId].users,
            code: rooms[roomId].code,
        });

        console.log(`${username} has joined room ${roomId} successfully`);
    });

    // Handle code changes
    socket.on('codeChange', ({ roomId, code }) => {
        if (!rooms[roomId]) return;

        // Update the code for the room
        rooms[roomId].code = code;

        // Broadcast code changes to other users in the room
        socket.to(roomId).emit('codeChange', code);
    });

    const handleUserLeavingRoom = (socket) => {
        let roomId = null;
        let username = null;

        // Find the room and remove the user
        for (const room in rooms) {
            const userIndex = rooms[room].users.findIndex((user) => user.id === socket.id);
            if (userIndex !== -1) {
                roomId = room;
                username = rooms[room].users[userIndex].username;

                // Remove user from the room
                rooms[room].users.splice(userIndex, 1);
                socket.leave(room);

                if (rooms[room].users.length === 0) {
                    delete rooms[room];
                } else {
                    // Notify other users in the room about the user leaving
                    socket.to(roomId).emit('userDisconnected', { id: socket.id, username });
                    // Update the users list for the remaining users
                    io.to(roomId).emit('updateUserList', rooms[room].users);
                }
                console.log(`${username} has left or disconnected from room ${roomId}`);
                break;
            }
        }

        if (roomId) {
            io.to(roomId).emit('userLeft', { username });
        }
    };

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log("Disconnected from the server");
        handleUserLeavingRoom(socket);
    });

    // Handle user leaving a room
    socket.on('leaveRoom', ({ roomId }, callback) => {
        if (!rooms[roomId]) return callback({ status: 'error', message: 'Room does not exist.' });

        handleUserLeavingRoom(socket);

        callback({ status: 'success', message: 'Left the room successfully.' });
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

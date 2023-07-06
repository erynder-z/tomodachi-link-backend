import { Server } from 'socket.io';
import http from 'http';

export const initializeSocketIo = (
    server: http.Server,
    corsOptions: {
        origin: (origin: any, callback: any) => void;
    }
) => {
    const io = new Server(server, {
        cors: corsOptions,
    });

    io.on('connection', (socket) => {
        console.log(`user connected: ${socket.id}`);

        socket.on('joinRoom', (data) => {
            socket.join(data);
        });

        socket.on('sendMessage', (data) => {
            socket.to(data.chatroomId).emit('receiveMessage', data);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

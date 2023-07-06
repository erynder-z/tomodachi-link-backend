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

    let users: { userId: string; socketId?: string }[] = [];

    const addUser = (userId: string, socketId: string) => {
        !users.some((user) => user.userId === userId) &&
            users.push({ userId, socketId });
    };

    const removeUser = (socketId: string) => {
        users = users.filter((user) => user.socketId !== socketId);
    };

    const getUser = (userId: string) => {
        return users.find((user) => user.userId === userId);
    };

    io.on('connection', (socket) => {
        console.log(`user connected: ${socket.id}`);

        socket.on('addUser', (userId) => {
            addUser(userId, socket.id);
            io.emit('getUsers', users);
        });

        socket.on(
            'sendMessage',
            ({ senderId, receiverId, text, timestamp }) => {
                console.log({ senderId, receiverId, text });
                const user = getUser(receiverId);
                io.to(user?.socketId as string).emit('receiveMessage', {
                    senderId,
                    text,
                    timestamp,
                });
            }
        );

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            removeUser(socket.id);
            io.emit('getUsers', users);
        });
    });
};

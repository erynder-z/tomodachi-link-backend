import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { SocketUser } from '../types/socketUser';
/**
 * Initializes a socket.io server and sets up event listeners for user connection, disconnection, adding user, sending and receiving messages, and user typing.
 *
 * @param {http.Server} server - the HTTP server instance
 * @param {cors.CorsOptions} corsOptions - the CORS options
 * @return {void}
 */
export const initializeSocketIo = (
    server: http.Server,
    corsOptions: cors.CorsOptions
): void => {
    const io = new Server(server, {
        cors: corsOptions,
    });

    let users: { userId: string; socketId?: string }[] = [];

    /**
     * Adds a new user with the specified userId and socketId to the users array if the user does not already exist.
     *
     * @param {string} userId - The unique identifier of the user.
     * @param {string} socketId - The unique identifier of the socket associated with the user.
     */
    const addUser = (userId: string, socketId: string) => {
        !users.some((user) => user.userId === userId) &&
            users.push({ userId, socketId });
    };

    /**
     * Removes a user from the users array based on the provided socket ID.
     *
     * @param {string} socketId - The socket ID of the user to be removed
     * @return {void}
     */
    const removeUser = (socketId: string): void => {
        users = users.filter((user) => user.socketId !== socketId);
    };

    /**
     * Retrieves a user by their userId.
     *
     * @param {string} userId - The unique identifier of the user
     * @return {SocketUser | undefined} The user with the specified userId, or undefined if not found
     */
    const getUser = (userId: string): SocketUser | undefined => {
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
            ({ senderId, receiverId, conversationId, text }) => {
                const user = getUser(receiverId);
                io.to(user?.socketId as string).emit('receiveMessage', {
                    senderId,
                    text,
                });
                io.to(user?.socketId as string).emit('notifyUnreadMessage', {
                    conversationId,
                });
            }
        );

        socket.on('typing', ({ senderId, receiverId }) => {
            const user = getUser(receiverId);
            io.to(user?.socketId as string).emit('typing', {
                senderId,
                receiverId,
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            removeUser(socket.id);
            io.emit('getUsers', users);
        });
    });
};

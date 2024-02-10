import mongoose from 'mongoose';

/**
 * Initializes MongoDB connection and sets up event handlers for graceful termination.
 */
export const initializeMongoDB = () => {
    const mongoDB = `${process.env.MONGODB_URI}`;

    mongoose.set('strictQuery', false);
    mongoose.connect(mongoDB);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));

    process.on('SIGINT', () => {
        db.close(true).then(() => {
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    });
};

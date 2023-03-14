import mongoose from 'mongoose';

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

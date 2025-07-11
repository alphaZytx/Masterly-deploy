import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI environment variable is not set");
        }
        const conn = await mongoose.connect(mongoUri);
        const db = conn.connection?.db;
        if (!db) {
            throw new Error("Database connection is undefined");
        }
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.db.databaseName}`);
        console.log(`Collections: ${Object.keys(conn.connection.collections).join(', ')}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred while connecting to MongoDB.');
        }
        process.exit(1);
    }
};

export default connectDB;
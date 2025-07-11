import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/personalized_learning';
        const conn = await mongoose.connect(mongoUri);
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
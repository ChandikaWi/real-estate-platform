import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt connection to the database using the URI from the .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Exit the process with a failure code if the connection drops
    process.exit(1); 
  }
};

export default connectDB;
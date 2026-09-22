import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
dotenv.config();
export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {      
      return;
    }

    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot";

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      // console.log("🔌 MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    // console.log("📝 Continuing with in-memory storage fallback");
  }
};
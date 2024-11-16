import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    const result = await mongoose.connect(process.env.MONGO_URI);
    console.log(`db connected successfully`);
  } catch (error) {
    console.log(`error while connecting to database `);
  }
};

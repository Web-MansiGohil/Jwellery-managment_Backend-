import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js";


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log('MongoDb is connect with server');
            }).catch((error) => {
                console.log('error of connection:', error);
            })

    } catch (error) {
        throw new ApiError(500, "Error connecting to database");
    }
}

export { connectDB };
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './Models/Order.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const order = await Order.findOne({ order_status: "Delivered" });
        if (order) {
            console.log("Found a Delivered order:");
            console.log(JSON.stringify(order, null, 2));
        } else {
            console.log("No Delivered orders found. Checking any order:");
            const anyOrder = await Order.findOne();
            console.log(JSON.stringify(anyOrder, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

test();

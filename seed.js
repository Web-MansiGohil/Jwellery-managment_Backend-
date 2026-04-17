import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Category from './Models/Category.js';
import { Product } from './Models/Product.js';

const images = {
    Rings: '/images/ring_product_1773515597048.png',
    Necklaces: '/images/necklace_product_1773515614173.png',
    Earrings: '/images/earring_product_1773515628626.png',
    Bangles: '/images/bangle_product_1773515644828.png'
};

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected to seed DB.');

        await Category.deleteMany({});
        await Product.deleteMany({});

        const categoriesData = ['Rings', 'Necklaces', 'Earrings', 'Bangles'].map(name => ({
            name,
            description: `Beautiful ${name}`
        }));

        const insertedCategories = await Category.insertMany(categoriesData);

        const productsData = [];
        insertedCategories.forEach((cat, index) => {
            const styles = ['Signature', 'Classic', 'Elegant', 'Vintage', 'Modern'];
            const materials = ['Diamond', 'Gold', 'Silver', 'Platinum', 'Sapphire'];
            for (let i = 1; i <= 5; i++) {
                productsData.push({
                    name: `${styles[i-1]} ${materials[i-1]} ${cat.name.slice(0, -1)}`,
                    categoryId: cat._id,
                    price: (index + 1) * 1000 + (i * 350),
                    weight: (index + 1) * 2.5 + i,
                    metalType: (index + i) % 2 === 0 ? '18kt Rose Gold' : 'Platinum',
                    purity: 'VVS1',
                    description: `An exquisite ${cat.name.slice(0, -1)} crafted to perfection. This is the ${styles[i-1].toLowerCase()} design variation blending timeless elegance with modern artistry.`,
                    stock: 10 + (i * 5),
                    images: [images[cat.name]]
                });
            }
        });

        const insertedProducts = await Product.insertMany(productsData);

        console.log('Database seeded successfully.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();

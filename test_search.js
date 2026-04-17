import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './Models/Product.js';
import { aggregationFunction } from './utils/aggregateFunction.js';

dotenv.config();

const testSearch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for search testing...\n');

        // Test 1: Search for "rings" - should only match products with "rings" in name
        console.log('🔍 Testing search for "rings":');
        const ringsResult = await aggregationFunction(Product, { search: 'rings' }, {
            searchFild: ["name", "description"],
            project: { name: 1, categoryId: 1 }
        });

        console.log('Products found:', ringsResult.data.length);
        ringsResult.data.forEach(product => {
            console.log(`- ${product.name}`);
        });

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Search for "earrings" - should only match products with "earrings" in name
        console.log('🔍 Testing search for "earrings":');
        const earringsResult = await aggregationFunction(Product, { search: 'earrings' }, {
            searchFild: ["name", "description"],
            project: { name: 1, categoryId: 1 }
        });

        console.log('Products found:', earringsResult.data.length);
        earringsResult.data.forEach(product => {
            console.log(`- ${product.name}`);
        });

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Search for "diamond" - should match both rings and earrings with diamond
        console.log('🔍 Testing search for "diamond":');
        const diamondResult = await aggregationFunction(Product, { search: 'diamond' }, {
            searchFild: ["name", "description"],
            project: { name: 1, categoryId: 1 }
        });

        console.log('Products found:', diamondResult.data.length);
        diamondResult.data.forEach(product => {
            console.log(`- ${product.name}`);
        });

        console.log('\n✅ Search testing completed!');

    } catch (error) {
        console.error('❌ Search test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testSearch();
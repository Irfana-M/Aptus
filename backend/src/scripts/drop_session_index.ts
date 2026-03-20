import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function dropIndex() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not defined in .env');
        
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('DB connection failed');
        const collection = db.collection('class_sessions');

        // Drop index by name if known, or by keys
        // Based on our model, it's likely named timeSlotId_1
        try {
            await collection.dropIndex('timeSlotId_1');
            console.log('✅ Successfully dropped index timeSlotId_1');
        } catch (e) {
            console.log('ℹ️ Index timeSlotId_1 not found or already dropped. Trying by keys...');
            try {
                await collection.dropIndex({ timeSlotId: 1 } as any);
                console.log('✅ Successfully dropped index by keys { timeSlotId: 1 }');
            } catch (err) {
                console.error('❌ Failed to drop index by keys:', err);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error dropping index:', error);
        process.exit(1);
    }
}

dropIndex();

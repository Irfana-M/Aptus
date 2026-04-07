import mongoose from 'mongoose';
import { SessionModel } from '../models/scheduling/session.model';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

async function checkDuplicates() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not defined in .env');
        
        await mongoose.connect(uri);
        logger.info('✅ Connected to MongoDB');

        const duplicates = await SessionModel.aggregate([
            {
                $group: {
                    _id: { timeSlotId: "$timeSlotId", startTime: "$startTime" },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        if (duplicates.length > 0) {
            logger.warn(`❌ Found ${duplicates.length} duplicate session groups!`);
            console.log(JSON.stringify(duplicates, null, 2));
        } else {
            logger.info('✅ No duplicate sessions found. Safe to proceed with index migration.');
        }

        await mongoose.disconnect();
    } catch (error) {
        logger.error('❌ Error checking duplicates:', error);
        process.exit(1);
    }
}

checkDuplicates();

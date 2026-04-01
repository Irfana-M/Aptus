import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkTrials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const trials = await db.collection('trialclasses').find({
      preferredDate: { $gte: todayStart, $lte: todayEnd }
    }).toArray();
    console.log(`Trial classes today: ${trials.length}`);
    
    trials.forEach(t => {
      console.log(`Trial ID: ${t._id}`);
      console.log(`Preferred Time: ${t.preferredTime}`);
      console.log(`Status: ${t.status}`);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTrials();

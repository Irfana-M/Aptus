import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findInUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    const targetId = '696788152e03c64c8a9cee98';
    console.log(`Searching for ID: ${targetId} in 'users' collection...`);
    
    const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(targetId) });
    if (user) {
        console.log(`Found User: ${user.fullName} (${user.email}) - Role: ${user.role}`);
    } else {
        console.log('User not found by ObjectId.');
        const allUsers = await db.collection('users').find({}).toArray();
        const found = allUsers.find(u => u._id.toString() === targetId);
        if (found) {
            console.log(`Found User (string match): ${found.fullName}`);
        } else {
            console.log('User truly not found in users collection.');
        }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findInUsers();

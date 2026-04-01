import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus');
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check count in class_sessions
    const count = await db.collection('class_sessions').countDocuments();
    console.log(`Total sessions in class_sessions: ${count}`);
    
    // Find ONE session from ANY time
    const anySession = await db.collection('class_sessions').findOne({});
    console.log('Any session sample:', anySession);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCollections();

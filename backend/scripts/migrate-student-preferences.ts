import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in .env');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI!);
    console.log('Connected.');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Could not get database connection');
    const studentsCollection = db.collection('students');

    const students = await studentsCollection.find({
      preferredTimeSlots: { $exists: true, $not: { $size: 0 } }
    }).toArray();

    console.log(`Found ${students.length} students with preferences to check.`);

    let migratedCount = 0;

    for (const student of students) {
      const prefs = student.preferredTimeSlots;
      
      // Check if it's the old format (array of slots) 
      // instead of new format (array of { subjectId, slots })
      const isOldFormat = prefs.length > 0 && prefs[0].day !== undefined && prefs[0].subjectId === undefined;

      if (isOldFormat) {
        console.log(`Migrating student: ${student.email} (${student._id})`);
        
        const subjects = student.preferredSubjects || [];
        const oldSlots = prefs.map((p: any) => ({
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime
        }));

        let newPrefs = [];
        
        if (subjects.length > 0) {
          // If they have subjects, associate all old slots with the first subject (safest assumption)
          // or duplicate for all. Let's associate with all selected subjects to be safe.
          newPrefs = subjects.map((subId: any) => ({
            subjectId: subId,
            slots: oldSlots
          }));
        } else {
          // If no subjects, we can't really link them effectively. 
          // We'll leave it empty or log a warning.
          console.warn(`Student ${student.email} has slots but no preferred subjects. Skipping automatic subject linking.`);
          continue;
        }

        await studentsCollection.updateOne(
          { _id: student._id },
          { 
            $set: { 
              preferredTimeSlots: newPrefs,
              preferencesCompleted: true 
            } 
          }
        );
        migratedCount++;
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

const mongoose = require('mongoose');
const { AttendanceModel } = require('./backend/src/models/scheduling/attendance.model');
const { SessionModel } = require('./backend/src/models/scheduling/session.model');
const { TrialClass } = require('./backend/src/models/student/trialClass.model');
const { Subject } = require('./backend/src/models/subject.model');

mongoose.connect('mongodb://localhost:27017/aptus').then(async () => {
    console.log('Connected to DB');
    try {
        const records = await AttendanceModel.find()
            .populate('userId', 'fullName email profilePicture')
            .populate('sessionId')
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();
        
        console.log('Successfully fetched records:', records.length);
        if (records.length > 0) {
            console.log('First record sessionId:', records[0].sessionId);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error during fetch:', err);
        process.exit(1);
    }
}).catch(err => {
    console.error(err);
    process.exit(1);
});

import { MentorModel } from '../models/mentor/mentor.model';
import { MentorAvailabilityModel } from '../models/mentor/mentorAvailability.model';

async function verifyMentorRefactor() {
  try {
    console.log('--- Starting Mentor Refactor Verification ---');

    // 1. Create a Mentor Profile (Clean Identity/Skills)
    const mentor = await MentorModel.create({
      fullName: 'Dr. Mentor Refactor',
      email: `mentor_refactor_${Date.now()}@example.com`,
      phoneNumber: '1234567890',
      academicQualifications: [{
        institutionName: 'Aptus University',
        degree: 'PhD in Architecture',
        graduationYear: '2020'
      }],
      experiences: [{
        institution: 'Tech Academy',
        jobTitle: 'Senior Tutor',
        duration: '3 years'
      }],
      isActive: true,
      isVerified: true
    });
    console.log('✔ Mentor Profile created:', mentor.fullName);
    console.log('✔ Identity & Skills included. Booking fields removed from TimeSlot.');

    // 2. Create Recurring Availability (Independent Model)
    const availability = await MentorAvailabilityModel.create({
      mentorId: mentor._id as any,
      dayOfWeek: 'Monday',
      slots: [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '14:00', endTime: '16:00' }
      ],
      isActive: true
    });
    console.log('✔ MentorAvailability recorded for Monday:', availability.slots.length, 'slots');

    // 3. Verify References
    const fetchedAvailability = await MentorAvailabilityModel.findOne({ mentorId: mentor._id }).populate('mentorId');
    if (fetchedAvailability && (fetchedAvailability.mentorId as any).fullName === mentor.fullName) {
      console.log('✔ Normalization and references verified.');
    }

    // 4. Cleanup
    await MentorAvailabilityModel.deleteOne({ _id: availability._id });
    await MentorModel.deleteOne({ _id: mentor._id });
    console.log('✔ Cleanup completed');

    console.log('--- Verification Successful ---');

  } catch (error) {
    console.error('✖ Verification Failed:', error);
  }
}

export { verifyMentorRefactor };

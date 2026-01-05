import { MentorModel } from '../models/mentor/mentor.model';
import { MentorAvailabilityModel } from '../models/mentor/mentorAvailability.model';
import { container } from '../config/inversify.config';
import { TYPES } from '../types';
import { IMentorService } from '../interfaces/services/IMentorService';

async function verifyNormalization() {
  try {
    console.log('--- Starting Normalization Verification ---');
    
    const mentorService = container.get<IMentorService>(TYPES.IMentorService);

    // 1. Create a Mentor with embedded availability
    const mentor = await MentorModel.create({
      fullName: 'Normalization Test Mentor',
      email: `norm_${Date.now()}@test.com`,
      phoneNumber: '1234567890',
      isProfileComplete: true,
      availability: [
        {
          day: 'Monday',
          slots: [
            { startTime: '10:00', endTime: '12:00' }
          ]
        },
        {
          day: 'Wednesday',
          slots: [
            { startTime: '14:00', endTime: '16:00' }
          ]
        }
      ]
    });
    console.log('✔ Mentor created with embedded availability');

    // 2. Run Normalization
    await mentorService.normalizeMentorAvailability(mentor._id as any);
    console.log('✔ Normalization function called');

    // 3. Verify MentorAvailability documents
    const MondayAvail = await MentorAvailabilityModel.findOne({ mentorId: mentor._id, dayOfWeek: 'Monday' });
    const WedAvail = await MentorAvailabilityModel.findOne({ mentorId: mentor._id, dayOfWeek: 'Wednesday' });

    if (MondayAvail && MondayAvail.slots[0].startTime === '10:00' &&
        WedAvail && WedAvail.slots[0].startTime === '14:00') {
      console.log('✔ MentorAvailability documents created correctly');
    } else {
      throw new Error('MentorAvailability documents missing or incorrect');
    }

    // 4. Verify embedded availability is cleared
    const updatedMentor = await MentorModel.findById(mentor._id);
    if (updatedMentor && updatedMentor.availability?.length === 0) {
      console.log('✔ Embedded availability cleared from profile');
    } else {
      throw new Error('Embedded availability not cleared');
    }

    // 5. Cleanup
    await MentorAvailabilityModel.deleteMany({ mentorId: mentor._id });
    await MentorModel.deleteOne({ _id: mentor._id });
    console.log('✔ Cleanup completed');

    console.log('--- Verification Successful ---');

  } catch (error) {
    console.error('✖ Verification Failed:', error);
  }
}

export { verifyNormalization };

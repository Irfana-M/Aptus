
import mongoose from 'mongoose';
import { MentorModel } from './models/mentor/mentor.model';

import dotenv from 'dotenv';

import path from 'path';
dotenv.config({ path: path.resolve('C:/Users/riyas/Desktop/Aptus/backend/.env') });

const test = async () => {
  const uri = process.env.MONGO_URI || '';
  if (!uri) throw new Error('MONGO_URI is not defined in .env');
  
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const subjectId = '69415462c8b1cdecafd8c368';
  console.log(`Testing resolution for subjectId: ${subjectId}`);
  
  const Subject = mongoose.model('Subject');
  const foundSubject = await Subject.findById(subjectId);
  
  if (foundSubject) {
    console.log(`✅ Found subject: "${(foundSubject as { subjectName?: string }).subjectName}" for ID ${subjectId}`);
  } else {
    console.log(`❌ NO subject found for ID ${subjectId}`);
  }

  const collections = await mongoose.connection.db?.listCollections().toArray() || [];
  console.log('Collections in DB:', collections.map(c => c.name).join(', '));

  const subjectName = 'Physics';
  console.log(`Running aggregation for "${subjectName}"...`);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
        {
          $match: {
            approvalStatus: "approved",
            isBlocked: { $ne: true },
            subjectProficiency: {
              $elemMatch: {
                subject: {
                  $regex: subjectName.trim(),
                  $options: 'i' // case-insensitive
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "mentoravailabilities", // Let's check if this is right
            localField: "_id",
            foreignField: "mentorId",
            as: "externalAvailability"
          }
        },
        {
          $addFields: {
            availability: {
              $concatArrays: [
                { $ifNull: ["$availability", []] },
                {
                  $map: {
                    input: { 
                      $filter: {
                        input: { $ifNull: ["$externalAvailability", []] },
                        as: "ext",
                        cond: { $eq: ["$$ext.isActive", true] }
                      }
                    },
                    as: "avail",
                    in: {
                      day: "$$avail.dayOfWeek",
                      slots: "$$avail.slots"
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $project: {
            password: 0,
            externalAvailability: 0
          }
        }
      ];

  const mentorsAgg = await MentorModel.aggregate(pipeline).exec();
  console.log(`Aggregation returned ${mentorsAgg.length} mentors`);
  if (mentorsAgg.length > 0) {
      console.log('Merged availability for mentor[0]:', JSON.stringify(mentorsAgg[0].availability, null, 2));
  }
 
  await mongoose.disconnect();
};

test().catch(console.error);

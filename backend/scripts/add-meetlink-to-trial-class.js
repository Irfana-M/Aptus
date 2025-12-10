/**
 * Quick fix script to add meetLink to existing trial class
 * Run this in MongoDB Compass or mongosh
 */

// Update the specific trial class with ID: 69193d1068cecbf391fa6400
db.trialclasses.updateOne(
  { _id: ObjectId("69193d1068cecbf391fa6400") },
  { 
    $set: { 
      meetLink: "http://localhost:5173/classroom/69193d1068cecbf391fa6400"
    } 
  }
);

// Verify the update
db.trialclasses.findOne({ _id: ObjectId("69193d1068cecbf391fa6400") });

// Optional: Update ALL assigned trial classes that don't have a meetLink
db.trialclasses.updateMany(
  { 
    status: "assigned",
    meetLink: { $exists: false }
  },
  [
    {
      $set: {
        meetLink: {
          $concat: [
            "http://localhost:5173/classroom/",
            { $toString: "$_id" }
          ]
        }
      }
    }
  ]
);

console.log("✅ Trial class(es) updated with meetLink!");

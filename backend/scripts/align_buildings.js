const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

const buildingUpdates = {
  'Principal Office': [72.54677427247354, 23.03467899639271],
  'LRC Library Block': [72.54814340483861, 23.034960346252305],
  'Computer Department': [72.54836182674394, 23.03344543657921],
  'Instrumentation & Control Department': [72.54836182674394, 23.03344543657921],
  'Civil Engineering Department': [72.54836182674394, 23.03344543657921],
  'Civil Drawing Hall': [72.54711695997935, 23.034264015234534],
  'Applied Mechanics Department': [72.54606386883316, 23.033504660363132],
  'Chemical Engineering Department': [72.54497550212473, 23.033903045055563],
  'Textile Technology Department': [72.54554369637746, 23.032659606539077],
  'Anexee Building': [72.54520257519019, 23.033121264085594],
  'Rubber Department': [72.5450098818308, 23.03411301559614],
  'Plastic Department': [72.5450098818308, 23.03411301559614],
  'EC Engineering Department': [72.5450098818308, 23.03411301559614],
};

async function updateBuildings() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  console.log("Connected to MongoDB.");
  
  for (const [name, coords] of Object.entries(buildingUpdates)) {
    const result = await db.collection('buildings').updateOne(
      { name: name },
      { $set: { "location.coordinates": coords } }
    );
    console.log(`Updated ${name}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }
  
  console.log("Done updating coordinates.");
  process.exit(0);
}

updateBuildings().catch(console.error);

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

const revertUpdates = {
  'Principal Office': [72.54659706772229, 23.03384709440613],
  'LRC Library Block': [72.54745093655256, 23.03578926359241],
  'Computer Department': [72.54848227912254, 23.033786487930065],
  'Instrumentation & Control Department': [72.54775796391216, 23.03530266705575],
  'Civil Engineering Department': [72.54665522715939, 23.035429239465817],
  'Chemical Engineering Department': [72.54495416874478, 23.033937231994976],
  'Anexee Building': [72.54499089749079, 23.033042706060158]
};

async function revertBuildings() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  console.log("Connected to MongoDB for reverting.");
  
  for (const [name, coords] of Object.entries(revertUpdates)) {
    const result = await db.collection('buildings').updateOne(
      { name: name },
      { $set: { "location.coordinates": coords } }
    );
    console.log(`Reverted ${name}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }
  
  console.log("Done reverting coordinates.");
  process.exit(0);
}

revertBuildings().catch(console.error);

// backend/models/Classroom.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassroomSchema = new Schema({
  roomNumber: { type: String, required: true },
  building: { type: Schema.Types.ObjectId, ref: 'Building' },
  capacity: { type: Number },
  equipment: [String], // e.g., 'Projector', 'Whiteboard'
});

// Create a compound index to ensure room numbers are unique within a building
ClassroomSchema.index({ roomNumber: 1, building: 1 }, { unique: true });

module.exports = mongoose.model('Classroom', ClassroomSchema);

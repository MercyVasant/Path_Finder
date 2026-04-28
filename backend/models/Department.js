// backend/models/Department.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema({
  name: { type: String, required: true },
  hod: { type: String },
  building: { type: Schema.Types.ObjectId, ref: 'Building' },
  contact: {
    email: String,
    phone: String,
  },
});

module.exports = mongoose.model('Department', DepartmentSchema);

const mongoose = require('mongoose');

// This schema is updated to include a 'details' field for the faculty profile page.
const facultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    office: {
        building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
        roomNumber: { type: String }
    },
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple null emails
    details: { type: String } // Field for more info on the faculty detail page
});

module.exports = mongoose.model('Faculty', facultySchema);
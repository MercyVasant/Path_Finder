const Classroom = require('../models/Classroom');

exports.getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find().populate('building', 'name code');
        res.json(classrooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
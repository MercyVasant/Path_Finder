const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().populate('building');
        res.json(departments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id).populate('building');
        if (!department) return res.status(404).json({ message: 'Department not found' });
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDepartmentFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find({ department: req.params.id }).populate({
            path: 'office.building',
            model: 'Building'
        });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
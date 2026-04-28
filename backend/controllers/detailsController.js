const Building = require('../models/Building');
const Department = require('../models/Department');
const Classroom = require('../models/Classroom');

exports.getCollegeDetails = async (req, res) => {
    try {
        // Run database queries in parallel for maximum efficiency
        const [buildingCount, departmentCount, classroomCount, allBuildings, allDepartments] = await Promise.all([
            Building.countDocuments(),
            Department.countDocuments(),
            Classroom.countDocuments(),
            Building.find().sort({ name: 1 }),
            Department.find().populate('building').sort({ name: 1 })
        ]);

        res.json({
            buildingCount,
            departmentCount,
            classroomCount,
            allBuildings,
            allDepartments
        });

    } catch (err) {
        res.status(500).json({ message: "Server error while fetching college details." });
    }
};
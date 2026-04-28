const Faculty = require('../models/Faculty');

exports.searchFaculty = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }
        const terms = q.split(/\s+/).filter(Boolean);
        if (terms.length === 0) {
            return res.json([]);
        }
        
        // Create an array of regex conditions for each word
        const searchConditions = terms.map(term => ({
            name: new RegExp(term, 'i')
        }));

        const faculties = await Faculty.find({ $and: searchConditions })
            .populate('department', 'name')
            .limit(10);
        res.json(faculties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getFacultyById = async (req, res) => {
    try {
        const member = await Faculty.findById(req.params.id)
            .populate({
                path: 'department',
                populate: { path: 'building' }
            })
            .populate('office.building');
        if (!member) return res.status(404).json({ message: 'Faculty member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
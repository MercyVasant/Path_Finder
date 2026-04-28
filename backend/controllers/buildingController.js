const Building = require('../models/Building');

exports.searchBuildings = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]); 
        }

        const regex = new RegExp(query, 'i');
        const buildings = await Building.find({ 
            $or: [
                { name: regex },
                { aliases: regex }
            ]
        }).limit(5);

        // Expand buildings into individual suggestions including matched aliases
        let suggestions = [];
        buildings.forEach(b => {
            // Always include the main building name if it matches, or even if an alias matched,
            // we can include the main name. Let's include it.
            if (regex.test(b.name) && !suggestions.some(s => s.name === b.name)) {
                suggestions.push({ _id: b._id, name: b.name, location: b.location });
            }
            
            // Include any alias that matches the query as a standalone suggestion pointing to the same location
            if (b.aliases && Array.isArray(b.aliases)) {
                b.aliases.forEach(alias => {
                    if (regex.test(alias) && !suggestions.some(s => s.name === alias)) {
                        suggestions.push({ _id: `${b._id}-${alias}`, name: alias, location: b.location, actualBuildingName: b.name });
                    }
                });
            }
            
            // If they search something broad and we just want them all to show if ANY part matches:
            // "in suggestion those all name to come which has location coordinates same as academic block 0"
            // Wait, if the user meant "If I search, show ALL the aliases as options", let's include all of them!
            // Let's just include all aliases of a matched building so they can see what's there.
            if (b.aliases && Array.isArray(b.aliases)) {
                b.aliases.forEach(alias => {
                    if (!suggestions.some(s => s.name === alias)) {
                        suggestions.push({ _id: `${b._id}-${alias}`, name: alias, location: b.location, actualBuildingName: b.name });
                    }
                });
            }
            
            // Ensure main building name is always there
            if (!suggestions.some(s => s.name === b.name)) {
                suggestions.push({ _id: b._id, name: b.name, location: b.location });
            }
        });

        // Limit the expanded suggestions
        res.json(suggestions.slice(0, 10));
    } catch (err) {
        res.status(500).json({ message: 'Server Error while searching buildings.' });
    }
};

exports.getBuildings = async (req, res) => {
    try {
        const buildings = await Building.find();
        res.json(buildings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBuildingById = async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);
        if (!building) return res.status(404).json({ message: 'Building not found' });
        res.json(building);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
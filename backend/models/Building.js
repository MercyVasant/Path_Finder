const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
    // The problematic 'code' field has been completely removed.
    name: {
        type: String,
        required: true,
        trim: true
    },
    aliases: {
        type: [String],
        default: []
    },
    info: {
        type: String,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // We are using Point for markers
            required: true
        },
        coordinates: {
            type: [Number], // Stored as [longitude, latitude]
            required: true
        }
    }
});

// Create a geospatial index for location-based queries in the future
buildingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Building', buildingSchema);


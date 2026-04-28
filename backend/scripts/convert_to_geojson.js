const fs = require('fs');
const osmtogeojson = require('osmtogeojson');

const data = JSON.parse(fs.readFileSync('overpass.json', 'utf8'));
const geojson = osmtogeojson(data);

// We need to add height property to each feature for OSMBuildings to work
geojson.features = geojson.features.map(f => {
    if (f.properties && f.properties.building) {
        // default height for 3D extrusion if no levels/height specified
        let height = 15; 
        if (f.properties['building:levels']) {
            height = parseInt(f.properties['building:levels']) * 4;
        } else if (f.properties.height) {
            height = parseFloat(f.properties.height);
        }
        f.properties.height = height;
        f.properties.minHeight = 0;
        
        // Add random slight height variations to make it look cool
        if (!f.properties['building:levels'] && !f.properties.height) {
            f.properties.height = 10 + Math.floor(Math.random() * 10);
        }
    }
    return f;
});

fs.writeFileSync('../frontend/public/campus-buildings.json', JSON.stringify(geojson));
console.log('Done converting to GeoJSON and saved to public folder!');

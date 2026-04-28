const { findShortestPath } = require('../utils/pathfinder');

// Load graph fresh each request so nodemon changes take effect
function loadGraph() {
    delete require.cache[require.resolve('../data/campus-graph.json')];
    return require('../data/campus-graph.json');
}

const getDistance = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

exports.getPath = (req, res) => {
    const { startCoords, endCoords } = req.body;
    if (!startCoords || !endCoords) return res.status(400).json({ message: "Start and end coordinates are required." });

    // Check if start and end coordinates are practically the same (e.g., less than 5 meters apart)
    const directDistance = Math.round(getDistance(startCoords, endCoords));
    if (directDistance < 5) {
        return res.json({ 
            path: [startCoords, endCoords], 
            distance: 0 
        });
    }

    const campusGraph = loadGraph();

    let startNodeId = null, endNodeId = null;
    let minStartDist = Infinity, minEndDist = Infinity;

    for (let nodeId in campusGraph.nodes) {
        const node = campusGraph.nodes[nodeId];
        const startDist = getDistance(startCoords, node.coords);
        if (startDist < minStartDist) { minStartDist = startDist; startNodeId = nodeId; }
        const endDist = getDistance(endCoords, node.coords);
        if (endDist < minEndDist) { minEndDist = endDist; endNodeId = nodeId; }
    }

    const result = findShortestPath(campusGraph, startNodeId, endNodeId);
    if (!result) return res.status(404).json({ message: "No path found." });

    const { path: pathNodeIds, distance: pathDistance } = result;
    const pathCoords = pathNodeIds.map(nodeId => campusGraph.nodes[nodeId].coords);
    pathCoords.unshift(startCoords);
    pathCoords.push(endCoords);

    const totalDistance = Math.round(minStartDist + pathDistance + minEndDist);
    res.json({ path: pathCoords, distance: totalDistance });
};
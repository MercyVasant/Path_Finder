/**
 * Hybrid campus graph builder:
 * - Uses real OSM road data for main campus roads
 * - Adds manual "entrance" nodes for buildings not near OSM roads
 * - Connects everything into a single walkable graph
 */
const fs = require('fs');
const https = require('https');

const BBOX = '23.031,72.543,23.038,72.551';

const query = `
[out:json][timeout:30];
(
  way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|footway|path|pedestrian|living_street)$"](${BBOX});
);
out body;
>;
out skel qt;
`;

const SKIP_TYPES = new Set(['motorway','trunk','motorway_link','trunk_link','construction','proposed']);

function fetchOverpass(query) {
    return new Promise((resolve, reject) => {
        const body = 'data=' + encodeURIComponent(query);
        const options = {
            hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
        };
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main() {
    console.log('Fetching campus road network from Overpass API...');
    const data = await fetchOverpass(query);

    const nodeMap = {};
    data.elements.filter(e => e.type === 'node').forEach(n => { nodeMap[n.id] = [n.lon, n.lat]; });

    const graphNodes = {};
    const graphEdges = [];

    // ── Named campus buildings ──────────────────────────────────────
    const namedBuildings = {
        "canteen":            { "name": "LD College Canteen",    "coords": [72.546693, 23.032719] },
        "chemical_dept":      { "name": "Chemical Department",   "coords": [72.545010, 23.034113] },
        "civil_dept":         { "name": "Civil Department",      "coords": [72.546655, 23.035429] },
        "civil_drawing_hall": { "name": "Civil Drawing Hall",    "coords": [72.547117, 23.034264] },
        "civil_lawn":         { "name": "Civil Lawn",            "coords": [72.546668, 23.037053] },
        "computer_dept":      { "name": "Computer Department",   "coords": [72.548482, 23.033786] },
        "cricket_ground":     { "name": "Cricket Ground",        "coords": [72.545315, 23.034945] },
        "ec_dept":            { "name": "EC Department",         "coords": [72.545010, 23.034113] },
        "hostel_a":           { "name": "Boys Hostel Block A",   "coords": [72.547661, 23.032230] },
        "hostel_b":           { "name": "Boys Hostel Block B",   "coords": [72.546158, 23.032031] },
        "hostel_e":           { "name": "Boys Hostel Block E",   "coords": [72.546199, 23.031512] },
        "ic_dept":            { "name": "IC Department",         "coords": [72.547758, 23.035303] },
        "lrc_library":        { "name": "LRC Library Block",     "coords": [72.547451, 23.035789] },
        "nss_office":         { "name": "NSS Office",            "coords": [72.548953, 23.032992] },
        "plastic_dept":       { "name": "Plastic Department",    "coords": [72.545010, 23.034113] },
        "principle_office":   { "name": "Principal Office",      "coords": [72.546597, 23.033847] },
        "rabdi_tea_stall":    { "name": "Rabdi Tea Stall",       "coords": [72.548704, 23.034152] },
        "rubber_dept":        { "name": "Rubber Department",     "coords": [72.547708, 23.036164] },
        "student_store":      { "name": "Student Store",         "coords": [72.547017, 23.035545] },
        "textile_dept":       { "name": "Textile Department",    "coords": [72.545544, 23.032660] },
        "vishwakarma_hall":   { "name": "Vishwakarma Hall",      "coords": [72.548239, 23.036114] },
        "anexee_building":    { "name": "Anexee Building",       "coords": [72.544991, 23.033043] },
        "applied_mechanics":  { "name": "Applied Mechanics",     "coords": [72.546064, 23.033505] }
    };

    // ── Manual internal campus path nodes (traced from campus map) ──
    // These are intermediate waypoints placed ON visible campus roads/paths
    // that are not mapped in OSM. They bridge buildings to OSM road nodes.
    const manualNodes = {
        "mn_main_gate_east":  { "name": "Main Gate East Junction",  "coords": [72.54535, 23.03416] },
        "mn_main_gate_west":  { "name": "Main Gate West Path",      "coords": [72.54510, 23.03416] },
        "mn_internal_nw":     { "name": "Internal Road NW",         "coords": [72.54612, 23.03440] },
        "mn_internal_n":      { "name": "Internal Road North",      "coords": [72.54680, 23.03440] },
        "mn_internal_ne":     { "name": "Internal Road NE",         "coords": [72.54730, 23.03440] },
        "mn_internal_mid":    { "name": "Internal Road Mid",        "coords": [72.54670, 23.03380] },
        "mn_north_w":         { "name": "North Road West",          "coords": [72.54609, 23.03551] },
        "mn_north_mid":       { "name": "North Road Mid",           "coords": [72.54729, 23.03547] },
        "mn_north_e":         { "name": "North Road East",          "coords": [72.54804, 23.03528] },
        "mn_west_road_n":     { "name": "West Campus Road North",   "coords": [72.54515, 23.03387] },
        "mn_west_road_s":     { "name": "West Campus Road South",   "coords": [72.54510, 23.03320] },
        "mn_east_road":       { "name": "East Campus Road",         "coords": [72.54848, 23.03380] },
        "mn_library_path":    { "name": "Library Path",             "coords": [72.54729, 23.03500] },
        "mn_principle_path":  { "name": "Principle Office Path",    "coords": [72.54640, 23.03395] },

        // ── LD College Internal Road (the main east-west road) ──────────────
        // This road runs east all the way to Academic Block 9 area.
        // Nodes are placed precisely on the road, going west → east.
        "mn_intrd_w1":   { "name": "Internal Rd W1",     "coords": [72.54510, 23.03295] },
        "mn_intrd_w2":   { "name": "Internal Rd W2",     "coords": [72.54560, 23.03285] },
        "mn_intrd_c1":   { "name": "Internal Rd C1",     "coords": [72.54610, 23.03278] },
        "mn_intrd_c2":   { "name": "Internal Rd C2 (canteen)", "coords": [72.54665, 23.03272] },
        "mn_intrd_c3":   { "name": "Internal Rd C3",     "coords": [72.54710, 23.03265] },
        "mn_intrd_e1":   { "name": "Internal Rd E1",     "coords": [72.54758, 23.03260] },
        "mn_intrd_e2":   { "name": "Internal Rd E2",     "coords": [72.54800, 23.03260] },
        "mn_intrd_e3":   { "name": "Internal Rd E3 (Academic Blk 9)", "coords": [72.54845, 23.03260] },

        // ── North-South connector roads between the internal road and upper campus ──
        // Road running EAST of yellow buildings (not through them)
        "mn_ns_east_n":  { "name": "NS East Connector North", "coords": [72.54665, 23.03430] },
        "mn_ns_east_s":  { "name": "NS East Connector South", "coords": [72.54665, 23.03278] },

        // Road on the west side of yellow buildings
        "mn_ns_west_n":  { "name": "NS West Connector North", "coords": [72.54610, 23.03440] },
        "mn_ns_west_s":  { "name": "NS West Connector South", "coords": [72.54610, 23.03278] },

        // Hostel south road
        "mn_hostel_row":      { "name": "Hostel Row Road",  "coords": [72.54645, 23.03215] }
    };

    Object.assign(graphNodes, namedBuildings, manualNodes);

    // ── Internal path edges (connecting manual nodes along visible roads) ──
    const manualEdges = [
        // ── North road (east-west at top of campus)
        ["mn_north_w",        "mn_north_mid",       130],
        ["mn_north_mid",      "mn_north_e",         80],

        // ── Upper internal east-west road through middle campus
        ["mn_main_gate_east", "mn_internal_nw",     90],
        ["mn_internal_nw",    "mn_internal_n",      68],
        ["mn_internal_n",     "mn_internal_ne",     55],
        ["mn_internal_ne",    "mn_north_mid",       115],
        ["mn_internal_nw",    "mn_ns_west_n",       0],   // same point, alias
        ["mn_internal_n",     "mn_ns_east_n",       0],   // same point, alias

        // ── LD College Internal Road (main east-west bottom road)
        // Goes fully west → east right to Academic Block 9
        ["mn_intrd_w1",       "mn_intrd_w2",        55],
        ["mn_intrd_w2",       "mn_intrd_c1",        55],
        ["mn_intrd_c1",       "mn_intrd_c2",        60],
        ["mn_intrd_c2",       "mn_intrd_c3",        50],
        ["mn_intrd_c3",       "mn_intrd_e1",        54],
        ["mn_intrd_e1",       "mn_intrd_e2",        47],
        ["mn_intrd_e2",       "mn_intrd_e3",        50],

        // ── North-south connectors (east side of yellow buildings — NOT through them)
        ["mn_ns_east_n",      "mn_ns_east_s",       170],  // road on east side of yellow buildings
        ["mn_ns_east_s",      "mn_intrd_c2",        6],    // meets the internal road

        // ── North-south connector (west side of yellow buildings)
        ["mn_ns_west_n",      "mn_ns_west_s",       180],
        ["mn_ns_west_s",      "mn_intrd_c1",        1],

        // ── West campus road
        ["mn_main_gate_west", "mn_west_road_n",     0],
        ["mn_west_road_n",    "mn_main_gate_east",  25],
        ["mn_west_road_n",    "mn_west_road_s",     70],
        ["mn_west_road_s",    "mn_intrd_w1",        25],

        // ── East campus north-south road
        ["mn_internal_ne",    "mn_east_road",       110],
        ["mn_east_road",      "mn_intrd_e2",        120],

        // ── North-south mid connections
        ["mn_internal_n",     "mn_internal_mid",    65],
        ["mn_internal_mid",   "mn_ns_east_s",       110],
        ["mn_internal_ne",    "mn_library_path",    50],
        ["mn_library_path",   "mn_north_mid",       48],
        ["mn_library_path",   "mn_internal_ne",     50],

        // ── Principle office path
        ["mn_principle_path", "mn_internal_mid",    60],
        ["mn_internal_nw",    "mn_principle_path",  45],

        // ── Hostel south road
        ["mn_intrd_c1",       "mn_hostel_row",      65],
        ["mn_hostel_row",     "mn_intrd_c2",        55],

        // ── Buildings → nearest road node
        ["lrc_library",       "mn_library_path",    50],
        ["student_store",     "mn_library_path",    70],
        ["civil_dept",        "mn_north_w",         53],
        ["civil_lawn",        "mn_north_w",         170],
        ["ic_dept",           "mn_north_e",         60],
        ["rubber_dept",       "mn_north_e",         90],
        ["vishwakarma_hall",  "mn_north_e",         95],
        ["civil_drawing_hall","mn_internal_ne",     80],
        ["principle_office",  "mn_principle_path",  30],
        ["applied_mechanics", "mn_internal_nw",     70],
        ["chemical_dept",     "mn_west_road_n",     55],
        ["ec_dept",           "mn_west_road_n",     55],
        ["plastic_dept",      "mn_west_road_n",     55],
        ["cricket_ground",    "mn_main_gate_east",  80],
        ["canteen",           "mn_intrd_c2",        5],
        ["hostel_b",          "mn_hostel_row",      25],
        ["hostel_e",          "mn_hostel_row",      75],
        ["hostel_a",          "mn_intrd_c3",        90],
        ["textile_dept",      "mn_intrd_w2",        50],
        ["anexee_building",   "mn_west_road_s",     60],
        ["nss_office",        "mn_east_road",       70],
        ["computer_dept",     "mn_east_road",       100],
        ["rabdi_tea_stall",   "mn_east_road",       50],
    ];
    graphEdges.push(...manualEdges);

    // ── OSM road nodes ──────────────────────────────────────────────
    let nodeCount = 0;
    const ways = data.elements.filter(e => e.type === 'way' && e.nodes && e.tags);

    ways.forEach(way => {
        const hw = way.tags.highway;
        if (!hw || SKIP_TYPES.has(hw)) return;
        if (way.tags.access === 'private' || way.tags.access === 'no') return;

        const wayNodeKeys = [];
        way.nodes.forEach(nid => {
            if (!nodeMap[nid]) return;
            const key = `r_${nid}`;
            if (!graphNodes[key]) {
                graphNodes[key] = { name: `${hw}_${nodeCount++}`, coords: nodeMap[nid] };
            }
            wayNodeKeys.push(key);
        });

        for (let i = 0; i < wayNodeKeys.length - 1; i++) {
            const a = wayNodeKeys[i], b = wayNodeKeys[i + 1];
            if (graphNodes[a] && graphNodes[b]) {
                const dist = Math.round(getDistance(graphNodes[a].coords, graphNodes[b].coords));
                if (dist > 0 && dist < 500) graphEdges.push([a, b, dist]);
            }
        }
    });

    // Connect manual nodes and buildings to nearby OSM road nodes (bridge the networks)
    const roadKeys = Object.keys(graphNodes).filter(k => k.startsWith('r_'));
    
    const nodesToBridge = { ...manualNodes, ...namedBuildings };
    Object.keys(nodesToBridge).forEach(mKey => {
        const mCoords = graphNodes[mKey].coords;
        let minDist = Infinity, nearestKey = null;
        roadKeys.forEach(rKey => {
            const d = getDistance(mCoords, graphNodes[rKey].coords);
            if (d < minDist) { minDist = d; nearestKey = rKey; }
        });
        // For buildings, allow a slightly larger snap radius if needed, but 80m is fine.
        if (nearestKey && minDist < 80) {
            graphEdges.push([mKey, nearestKey, Math.round(minDist)]);
        }
    });

    const graph = { nodes: graphNodes, edges: graphEdges };
    fs.writeFileSync('./data/campus-graph.json', JSON.stringify(graph, null, 2));
    console.log(`\nDone! Graph: ${Object.keys(graphNodes).length} nodes, ${graphEdges.length} edges`);
}

main().catch(console.error);

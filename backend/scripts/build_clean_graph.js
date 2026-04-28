/**
 * build_clean_graph.js
 *
 * Generates campus-graph.json by tracing every visible campus road as a
 * dense sequence of waypoints (~15 m apart).
 *
 * Strategy
 * --------
 * 1.  Define each road segment as an ordered list of [lon, lat] "anchor" points
 *     that follow the actual road centerline (traced from the map tile).
 * 2.  Interpolate extra waypoints between anchors so no two consecutive
 *     connected nodes are more than ~15 m apart.
 * 3.  At every physical road INTERSECTION, add a tiny bidirectional edge
 *     connecting the nearest nodes from each road so Dijkstra can turn.
 * 4.  Connect every building to the nearest road node.
 *
 * All coordinates are [longitude, latitude] (GeoJSON order).
 */

const fs   = require('fs');
const path = require('path');

// ─── Haversine ────────────────────────────────────────────────────────────────
function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
  const a  = Math.sin((lat2 - lat1) * Math.PI / 360) ** 2
           + Math.cos(p1) * Math.cos(p2) * Math.sin((lon2 - lon1) * Math.PI / 360) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Interpolate dense waypoints along a polyline ────────────────────────────
function densify(anchors, maxGap = 15) {
  const pts = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    const d = haversine(a, b);
    const steps = Math.ceil(d / maxGap);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push([+(a[0] + (b[0] - a[0]) * t).toFixed(7),
                +(a[1] + (b[1] - a[1]) * t).toFixed(7)]);
    }
  }
  pts.push(anchors[anchors.length - 1]);
  return pts;
}

// ─── Buildings ────────────────────────────────────────────────────────────────
const BUILDINGS = {
  canteen:            { name: 'LD College Canteen',       coords: [72.546693, 23.032719] },
  chemical_dept:      { name: 'Chemical Department',      coords: [72.545010, 23.034113] },
  civil_dept:         { name: 'Civil Department',         coords: [72.546655, 23.035429] },
  civil_drawing_hall: { name: 'Civil Drawing Hall',       coords: [72.547117, 23.034264] },
  civil_lawn:         { name: 'Civil Lawn',               coords: [72.546668, 23.037053] },
  computer_dept:      { name: 'Computer Department',      coords: [72.548482, 23.033786] },
  cricket_ground:     { name: 'Cricket Ground',           coords: [72.545315, 23.034945] },
  ec_dept:            { name: 'EC Department',            coords: [72.545010, 23.034113] },
  hostel_a:           { name: 'Boys Hostel Block A',      coords: [72.547661, 23.032230] },
  hostel_b:           { name: 'Boys Hostel Block B',      coords: [72.546158, 23.032031] },
  hostel_e:           { name: 'Boys Hostel Block E',      coords: [72.546199, 23.031512] },
  ic_dept:            { name: 'IC Department',            coords: [72.547758, 23.035303] },
  lrc_library:        { name: 'LRC Library Block',        coords: [72.547451, 23.035789] },
  nss_office:         { name: 'NSS Office',               coords: [72.548953, 23.032992] },
  plastic_dept:       { name: 'Plastic Department',       coords: [72.545010, 23.034113] },
  principle_office:   { name: 'Principal Office',         coords: [72.546597, 23.033847] },
  rabdi_tea_stall:    { name: 'Rabdi Tea Stall',          coords: [72.548704, 23.034152] },
  rubber_dept:        { name: 'Rubber Department',        coords: [72.547708, 23.036164] },
  student_store:      { name: 'Student Store',            coords: [72.547017, 23.035545] },
  textile_dept:       { name: 'Textile Department',       coords: [72.545544, 23.032660] },
  vishwakarma_hall:   { name: 'Vishwakarma Hall',         coords: [72.548239, 23.036114] },
  anexee_building:    { name: 'Anexee Building',          coords: [72.544991, 23.033043] },
  applied_mechanics:  { name: 'Applied Mechanics',        coords: [72.546064, 23.033505] },
  academic_block_1:   { name: 'Academic Block 1',         coords: [72.548750, 23.035050] },
  academic_block_2:   { name: 'Academic Block 2',         coords: [72.549100, 23.034350] },
  academic_block_3:   { name: 'Academic Block 3',         coords: [72.548600, 23.033200] },
  academic_block_9:   { name: 'Academic Block 9',         coords: [72.548500, 23.032550] },
  workshop:           { name: 'Workshop',                 coords: [72.545800, 23.033100] },
};

// ─── Road segments (anchor polylines traced on actual campus map) ─────────────
//
// Each entry: { id: prefix, anchors: [[lon,lat],...] }
// Nodes will be named  <id>_0, <id>_1, …
//
// HOW TO READ THE COORDINATES
//   Longitude increases → going East (right on map)
//   Latitude  increases → going North (up on map)
//
// LDCE campus spans roughly:
//   lon  72.5449 … 72.5495
//   lat  23.0310 … 23.0380

const ROAD_SEGMENTS = [

  // ══════════════════════════════════════════════════════════════════
  // 1.  MAIN GATE ROAD — enters from 120 Feet Ring Road on the west,
  //     runs east to the junction in front of the principal's office.
  //     lat ≈ 23.0344,  lon 72.5449 → 72.5488
  // ══════════════════════════════════════════════════════════════════
  { id: 'main_rd', anchors: [
    [72.54490, 23.03416],
    [72.54520, 23.03416],
    [72.54560, 23.03416],
    [72.54610, 23.03440],  // slight jog north at NS-1 connector
    [72.54650, 23.03440],
    [72.54680, 23.03440],
    [72.54730, 23.03440],
    [72.54770, 23.03440],
    [72.54810, 23.03435],
    [72.54848, 23.03425],  // east end — meets east N-S road
    [72.54880, 23.03440],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 2.  NORTH ROAD — runs east-west near civil dept / library
  //     lat ≈ 23.0355
  // ══════════════════════════════════════════════════════════════════
  { id: 'north_rd', anchors: [
    [72.54490, 23.03550],
    [72.54530, 23.03552],
    [72.54609, 23.03551],  // near civil dept
    [72.54670, 23.03548],
    [72.54729, 23.03547],  // library / student store area
    [72.54804, 23.03528],
    [72.54870, 23.03520],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 3.  HOSTEL ROW ROAD — runs east-west south of canteen
  //     Starts where user_rd (actual road) meets this row, so western
  //     approach is always via the traced road, not a shortcut.
  // ══════════════════════════════════════════════════════════════════
  { id: 'hostel_rd', anchors: [
    [72.54646, 23.03224],  // start: where user_rd east end meets this row
    [72.54680, 23.03255],
    [72.54710, 23.03265],
    [72.54758, 23.03260],
    [72.54800, 23.03260],
    [72.54845, 23.03258],
    [72.54880, 23.03262],  // east end
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 3b. USER_RD NORTH SPUR — connects user_rd east end northward
  //     up to the canteen entrance (bridges user_rd to hostel_rd)
  // ══════════════════════════════════════════════════════════════════
  { id: 'ur_spur', anchors: [
    [72.546461, 23.032241],  // user_rd east end
    [72.546500, 23.032390],
    [72.546550, 23.032550],
    [72.546600, 23.032680],
    [72.546693, 23.032719],  // canteen entrance
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 4.  SOUTH HOSTEL ROAD — further south, hostel E area
  //     lat ≈ 23.0315
  // ══════════════════════════════════════════════════════════════════
  { id: 'south_rd', anchors: [
    [72.54490, 23.03215],
    [72.54540, 23.03215],
    [72.54600, 23.03215],
    [72.54645, 23.03215],
    [72.54700, 23.03215],
    [72.54760, 23.03220],
    [72.54800, 23.03225],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 5.  WEST BOUNDARY ROAD — runs north-south on west edge of campus
  //     lon ≈ 72.5451
  // ══════════════════════════════════════════════════════════════════
  { id: 'west_rd', anchors: [
    [72.54490, 23.03190],
    [72.54490, 23.03215],
    [72.54510, 23.03270],
    [72.54510, 23.03320],
    [72.54510, 23.03380],
    [72.54490, 23.03416],
    [72.54490, 23.03460],
    [72.54490, 23.03500],
    [72.54490, 23.03550],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 6.  NS-1  connector — lon ≈ 72.5461
  //     Connects hostel row ↔ main road ↔ north road
  // ══════════════════════════════════════════════════════════════════
  { id: 'ns1_rd', anchors: [
    [72.54610, 23.03278],  // joins hostel_rd
    [72.54612, 23.03310],
    [72.54612, 23.03360],
    [72.54612, 23.03400],
    [72.54610, 23.03440],  // joins main_rd
    [72.54610, 23.03480],
    [72.54609, 23.03530],
    [72.54609, 23.03551],  // joins north_rd
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 7.  NS-2 connector — lon ≈ 72.5467 (canteen / principle office side)
  // ══════════════════════════════════════════════════════════════════
  { id: 'ns2_rd', anchors: [
    [72.54650, 23.03215],  // joins south_rd
    [72.54650, 23.03250],
    [72.54665, 23.03272],  // canteen area / hostel_rd
    [72.54665, 23.03310],
    [72.54660, 23.03360],
    [72.54660, 23.03400],
    [72.54650, 23.03440],  // joins main_rd
    [72.54655, 23.03480],
    [72.54660, 23.03520],
    [72.54670, 23.03548],  // joins north_rd
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 8.  NS-3 connector — lon ≈ 72.5473 (library / civil drawing area)
  // ══════════════════════════════════════════════════════════════════
  { id: 'ns3_rd', anchors: [
    [72.54710, 23.03265],  // joins hostel_rd
    [72.54710, 23.03310],
    [72.54720, 23.03360],
    [72.54730, 23.03400],
    [72.54730, 23.03440],  // joins main_rd
    [72.54729, 23.03480],
    [72.54729, 23.03547],  // joins north_rd
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 9.  NS-4 connector — lon ≈ 72.5480 (between library & east road)
  // ══════════════════════════════════════════════════════════════════
  { id: 'ns4_rd', anchors: [
    [72.54800, 23.03260],  // joins hostel_rd
    [72.54800, 23.03300],
    [72.54800, 23.03350],
    [72.54810, 23.03400],
    [72.54810, 23.03440],  // joins main_rd
    [72.54810, 23.03490],
    [72.54804, 23.03528],  // joins north_rd east end
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 10. EAST ROAD — lon ≈ 72.5488 (NSS office / computer dept / academic blocks)
  // ══════════════════════════════════════════════════════════════════
  { id: 'east_rd', anchors: [
    [72.54880, 23.03190],
    [72.54880, 23.03215],
    [72.54880, 23.03258],  // joins hostel_rd east end
    [72.54880, 23.03300],
    [72.54875, 23.03340],
    [72.54870, 23.03380],
    [72.54848, 23.03425],  // joins main_rd east end
    [72.54870, 23.03460],
    [72.54870, 23.03510],
    [72.54870, 23.03528],  // joins north_rd east end
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 11. FAR-EAST SPUR — academic blocks / NSS zone
  //     lon ≈ 72.5492, bridges east_rd to academic_block_2
  // ══════════════════════════════════════════════════════════════════
  { id: 'far_east', anchors: [
    [72.54880, 23.03258],  // start at east_rd (hostel level)
    [72.54910, 23.03280],
    [72.54920, 23.03320],
    [72.54920, 23.03360],
    [72.54910, 23.03400],
    [72.54880, 23.03440],  // rejoins east_rd at main level
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 12. PRINCIPLE-OFFICE LANE — short N-S spur from main_rd southward
  //     to principle office / applied mechanics area
  // ══════════════════════════════════════════════════════════════════
  { id: 'po_lane', anchors: [
    [72.54640, 23.03440],  // from main_rd
    [72.54640, 23.03415],
    [72.54640, 23.03395],
    [72.54640, 23.03370],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 13. WORKSHOP LANE — short spur west side of campus
  // ══════════════════════════════════════════════════════════════════
  { id: 'ws_lane', anchors: [
    [72.54490, 23.03295],
    [72.54530, 23.03310],
    [72.54580, 23.03310],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 14. CIVIL LAWN LANE — spur north of north_rd toward civil lawn
  // ══════════════════════════════════════════════════════════════════
  { id: 'cl_lane', anchors: [
    [72.54609, 23.03551],
    [72.54610, 23.03600],
    [72.54620, 23.03660],
    [72.54650, 23.03705],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 15. MID ROAD — short connector between main_rd and hostel_rd at centre
  //     lon ≈ 72.5465 – 72.5475   lat ≈ 23.0338 (fills the gap)
  // ══════════════════════════════════════════════════════════════════
  { id: 'mid_rd', anchors: [
    [72.54612, 23.03390],
    [72.54640, 23.03390],
    [72.54665, 23.03380],
    [72.54700, 23.03375],
    [72.54730, 23.03390],
    [72.54770, 23.03390],
    [72.54810, 23.03395],
    [72.54848, 23.03400],
  ]},

  // ══════════════════════════════════════════════════════════════════
  // 16. USER-TRACED ROAD — waypoints traced directly from the map
  //     covering the south-west campus road that was cutting through
  //     buildings. Connects west boundary → south of annexe → hostel row.
  //
  //     Original coords (lat, lon) provided by user:
  //       23.032920, 72.544929  →  23.032969, 72.545332
  //       → 23.032722, 72.545388  → 23.032182, 72.545466
  //       → 23.032157, 72.545514  → 23.032194, 72.545957
  //       → 23.032241, 72.546461
  //     Converted to [lon, lat] for our graph:
  // ══════════════════════════════════════════════════════════════════
  { id: 'user_rd', anchors: [
    [72.544929, 23.032920],
    [72.545332, 23.032969],
    [72.545388, 23.032722],
    [72.545466, 23.032182],
    [72.545514, 23.032157],
    [72.545957, 23.032194],
    [72.546461, 23.032241],
  ]},
];

// ─── Build graph nodes & edges from road segments ────────────────────────────
const nodes = {};   // id → { name, coords }
const edges = [];   // [id_a, id_b, metres]

// Store the ordered node IDs for each segment so we can cross-connect later
const segmentIds = {};

ROAD_SEGMENTS.forEach(seg => {
  const denseCoords = densify(seg.anchors, 15);
  const ids = denseCoords.map((c, i) => `${seg.id}_${i}`);
  segmentIds[seg.id] = ids;

  ids.forEach((id, i) => {
    nodes[id] = { name: id, coords: denseCoords[i] };
  });

  // Chain edges along the road
  for (let i = 0; i < ids.length - 1; i++) {
    const d = Math.round(haversine(denseCoords[i], denseCoords[i + 1]));
    edges.push([ids[i], ids[i + 1], d]);
  }
});

// ─── Cross-connect intersections ──────────────────────────────────────────────
// For each pair of segments, find the closest pair of nodes and add an edge
// if they are within 25 m (i.e. they share a physical intersection).

const allRoadIds = Object.keys(nodes);

function nearestNodeTo(coord, ids) {
  let bestId = null, bestD = Infinity;
  ids.forEach(id => {
    const d = haversine(coord, nodes[id].coords);
    if (d < bestD) { bestD = d; bestId = id; }
  });
  return { bestId, bestD };
}

// For every road segment pair, snap endpoints/close nodes together
const segKeys = Object.keys(segmentIds);
for (let i = 0; i < segKeys.length; i++) {
  for (let j = i + 1; j < segKeys.length; j++) {
    const idsA = segmentIds[segKeys[i]];
    const idsB = segmentIds[segKeys[j]];

    // Try all nodes of A against all nodes of B — but only snap closest pair
    let minD = Infinity, bestA = null, bestB = null;
    idsA.forEach(a => {
      idsB.forEach(b => {
        const d = haversine(nodes[a].coords, nodes[b].coords);
        if (d < minD) { minD = d; bestA = a; bestB = b; }
      });
    });

    if (minD <= 30) {
      edges.push([bestA, bestB, Math.round(minD)]);
    }
  }
}

// ─── Connect buildings to nearest road node ───────────────────────────────────
Object.entries(BUILDINGS).forEach(([bid, bdata]) => {
  nodes[bid] = bdata;   // add building to node map

  // Find 2 nearest road nodes
  let best1 = null, d1 = Infinity, best2 = null, d2 = Infinity;
  allRoadIds.forEach(rid => {
    const d = haversine(bdata.coords, nodes[rid].coords);
    if (d < d1) { d2 = d1; best2 = best1; d1 = d; best1 = rid; }
    else if (d < d2) { d2 = d; best2 = rid; }
  });

  if (best1) edges.push([bid, best1, Math.round(d1)]);
  if (best2 && d2 < d1 + 60) edges.push([bid, best2, Math.round(d2)]);
});

// ─── Write output ─────────────────────────────────────────────────────────────
const graph = { nodes, edges };
const outPath = path.join(__dirname, '../data/campus-graph.json');
fs.writeFileSync(outPath, JSON.stringify(graph, null, 2));

const roadNodeCount = Object.keys(nodes).length - Object.keys(BUILDINGS).length;
console.log(`✅ campus-graph.json written`);
console.log(`   Road nodes  : ${roadNodeCount}`);
console.log(`   Buildings   : ${Object.keys(BUILDINGS).length}`);
console.log(`   Total nodes : ${Object.keys(nodes).length}`);
console.log(`   Edges       : ${edges.length}`);

// ─── Quick self-test ──────────────────────────────────────────────────────────
const { findShortestPath } = require('../utils/pathfinder');

const tests = [
  ['canteen',         'academic_block_2'],
  ['canteen',         'computer_dept'],
  ['hostel_b',        'lrc_library'],
  ['chemical_dept',   'nss_office'],
  ['principle_office','academic_block_1'],
  ['civil_lawn',      'hostel_e'],
  ['textile_dept',    'vishwakarma_hall'],
];

console.log('\n── Self-test ──');
tests.forEach(([a, b]) => {
  const r = findShortestPath(graph, a, b);
  if (r) {
    console.log(`  ✓ ${a} → ${b}: ${r.distance} m  (${r.path.length} hops)`);
    // Show first and last few road nodes so we can verify it's road-following
    const preview = r.path.slice(0, 3).concat(['…']).concat(r.path.slice(-3));
    console.log(`    ${preview.join(' → ')}`);
  } else {
    console.log(`  ✗ ${a} → ${b}: NO PATH`);
  }
});

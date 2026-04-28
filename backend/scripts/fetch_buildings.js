const fs = require('fs');
const https = require('https');

const query = `
[out:json];
(
  way["building"](23.030,72.542,23.038,72.552);
  relation["building"](23.030,72.542,23.038,72.552);
);
out body;
>;
out skel qt;
`;

const url = 'https://overpass-api.de/api/interpreter';

const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('overpass.json', data);
        console.log('Done downloading overpass JSON');
    });
});
req.write('data=' + encodeURIComponent(query));
req.end();

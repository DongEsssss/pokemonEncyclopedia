const https = require('https');
const fs = require('fs');
const path = require('path');

const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];
const destDir = path.join(__dirname, 'public', 'maps');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const fullUrl = url.startsWith('http') ? url : 'https:' + url;
    https.get(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://bulbapedia.bulbagarden.net/' } }, (res) => {
      if (res.statusCode !== 200) {
        console.log('Failed to download ' + url + ': ' + res.statusCode);
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const region of regions) {
    console.log('Fetching ' + region + '...');
    const html = await fetchHtml('https://bulbapedia.bulbagarden.net/wiki/' + region);
    
    // Regex to find the first image containing "Map.png" or similar
    const imgRegex = /<img[^>]+src="([^">]+(Map|artwork|Let%27s_Go)[^">]*\.png)"/i;
    let match = html.match(imgRegex);
    
    // If not found, try a broader regex for any large image in the infobox
    if (!match) {
        const fallbackRegex = /<img[^>]+src="([^">]+\.png)"[^>]+width="(250|300)"/i;
        match = html.match(fallbackRegex);
    }

    if (match && match[1]) {
      let imgUrl = match[1];
      // Convert thumb URL to full URL if necessary
      if (imgUrl.includes('/thumb/')) {
        imgUrl = imgUrl.replace('/thumb/', '/').split('.png/')[0] + '.png';
      }
      console.log('Found URL: ' + imgUrl);
      const success = await downloadImage(imgUrl, path.join(destDir, region.toLowerCase() + '.png'));
      if (success) console.log('Downloaded ' + region + '.png');
    } else {
      console.log('Could not find map for ' + region);
    }
  }
}

run();

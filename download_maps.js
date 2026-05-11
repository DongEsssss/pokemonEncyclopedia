const https = require('https');
const fs = require('fs');
const path = require('path');

// 지원하는 지역 목록
const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];
const destDir = path.join(__dirname, 'public', 'maps');

// 저장 폴더가 없으면 생성
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

/**
 * URL에서 HTML 내용을 가져오는 함수
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * 이미지를 다운로드하여 로컬에 저장하는 함수
 */
async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const fullUrl = url.startsWith('http') ? url : 'https:' + url;
    https.get(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://bulbapedia.bulbagarden.net/' } }, (res) => {
      if (res.statusCode !== 200) {
        console.log('다운로드 실패 ' + url + ': ' + res.statusCode);
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

/**
 * 메인 실행 함수: 각 지역의 지도 이미지를 Bulbapedia에서 찾아 다운로드합니다.
 */
async function run() {
  for (const region of regions) {
    console.log(region + ' 정보 가져오는 중...');
    const html = await fetchHtml('https://bulbapedia.bulbagarden.net/wiki/' + region);
    
    // "Map.png" 또는 유사한 패턴의 이미지를 찾는 정규표현식
    const imgRegex = /<img[^>]+src="([^">]+(Map|artwork|Let%27s_Go)[^">]*\.png)"/i;
    let match = html.match(imgRegex);
    
    // 만약 찾지 못했다면, 인포박스 내의 큰 이미지를 찾는 예비 정규표현식 사용
    if (!match) {
        const fallbackRegex = /<img[^>]+src="([^">]+\.png)"[^>]+width="(250|300)"/i;
        match = html.match(fallbackRegex);
    }

    if (match && match[1]) {
      let imgUrl = match[1];
      // 섬네일 URL인 경우 원본 이미지 URL로 변환
      if (imgUrl.includes('/thumb/')) {
        imgUrl = imgUrl.replace('/thumb/', '/').split('.png/')[0] + '.png';
      }
      console.log('찾은 URL: ' + imgUrl);
      const success = await downloadImage(imgUrl, path.join(destDir, region.toLowerCase() + '.png'));
      if (success) console.log('다운로드 완료: ' + region + '.png');
    } else {
      console.log(region + '의 지도를 찾을 수 없습니다.');
    }
  }
}

run();

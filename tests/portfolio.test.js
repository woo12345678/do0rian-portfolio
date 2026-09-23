const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const projects = require('../projects.js');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.strictEqual(projects.length, 29, '포트폴리오에는 현재 29개 프로젝트가 있어야 합니다.');
assert.strictEqual(new Set(projects.map(p => p.id)).size, projects.length, '프로젝트 ID는 고유해야 합니다.');
projects.forEach(project => {
  ['id', 'title', 'url', 'image', 'kind', 'summary'].forEach(key => assert(project[key], `${project.id || 'project'}: ${key} 필드가 필요합니다.`));
  assert(/^https:\/\//.test(project.url) || /^[a-z0-9-]+\.html$/.test(project.url) || /^games\/[a-z0-9-]+\/(?:v\d+\.\d+\.\d+|[a-f0-9]+)\/$/.test(project.url), `${project.id}: 공개 HTTPS 또는 안전한 로컬 포트폴리오 링크가 필요합니다.`);
  assert(Array.isArray(project.tags) && project.tags.length, `${project.id}: 태그가 필요합니다.`);
  assert(fs.existsSync(path.join(root, project.image)), `${project.id}: 대표 이미지 파일이 실제로 존재해야 합니다.`);
});

const featured = projects.filter(p => p.featured);
assert.deepStrictEqual(featured.map(p => p.id), ['magic-brick', 'make-tteok', 'neon-dash-waves']);
const realDrive = projects.find(p => p.id === 'realdrive-horizon');
assert(realDrive, 'RealDrive Horizon 프로젝트가 필요합니다.');
assert.strictEqual(projects.indexOf(realDrive), 3, 'RealDrive Horizon은 featured 다음 archive 최상단에 있어야 합니다.');
assert.strictEqual(realDrive.url, 'https://woo12345678.github.io/do0rian-portfolio/realdrive-horizon.html');
assert.strictEqual(realDrive.image, 'assets/projects/realdrive-horizon.png');
assert.strictEqual(realDrive.kind, 'game');
assert(/WINDOWS/.test(realDrive.platform) && /UNITY/.test(realDrive.platform) && /IN DEVELOPMENT/.test(realDrive.platform));
assert(/오픈월드/.test(realDrive.summary) && /파손/.test(realDrive.summary), '자유 차량 파손 오픈월드라는 핵심을 설명해야 합니다.');
assert(/31/.test(realDrive.impact) && /6/.test(realDrive.impact) && /수리비/.test(realDrive.impact), '검증된 차량·지역·경제 범위를 표시해야 합니다.');
assert(realDrive.tags.includes('Vehicle Damage') && realDrive.tags.includes('Open World'), '핵심 게임 시스템 태그가 필요합니다.');
const ttakClub = projects.find(p => p.id === 'ttak-club');
const echoFront = projects.find(p => p.id === 'echo-front');
const vaultClick = projects.find(p => p.id === 'vault-click');
const stitchkeeper = projects.find(p => p.id === 'stitchkeeper');
const stitchkeeperInventorySha256 = '47c8ba506d16065e29cf1b3b247c3bb86d6ad4c02040de121c79c326a49f2860';
assert.deepStrictEqual(projects.slice(3, 8).map(p => p.id), ['realdrive-horizon', 'ttak-club', 'echo-front', 'vault-click', 'stitchkeeper'], '네 게임은 RealDrive 바로 다음, 비게임 프로젝트 전에 정확한 순서로 있어야 합니다.');
[
  [ttakClub, 'games/ttak-club/v1.0.3/', 'assets/projects/ttak-club-home.png', /7 Modes/, /119\/119/],
  [echoFront, 'https://woo12345678.github.io/do0rian-portfolio/echo-front.html', 'assets/projects/echo-front.png', /52 Heroes.*9 Modes.*11 Maps/, /96\/96/]
].forEach(([project, url, image, scope, tests]) => {
  assert(project, `${url}: 프로젝트가 필요합니다.`);
  assert.strictEqual(project.url, url);
  assert.strictEqual(project.image, image);
  assert.strictEqual(project.kind, 'game');
  assert.strictEqual(project.collaboration, true);
  assert(!project.featured, `${project.id}: featured로 표시하면 안 됩니다.`);
  assert(scope.test(project.impact) && tests.test(project.impact), `${project.id}: 검증된 범위와 테스트 수가 필요합니다.`);
});
assert(/BROWSER/.test(ttakClub.platform) && /STATIC/.test(ttakClub.platform) && /SOLO\/LOCAL/.test(ttakClub.platform) && /119 TESTS/.test(ttakClub.platform));
assert(/LOCAL BUILD/.test(echoFront.platform) && /SERVER REQUIRED/.test(echoFront.platform));
assert(/online rooms require (?:the )?server build/i.test(ttakClub.summary));
assert(/결정론적/.test(ttakClub.summary) && /Canvas 2D/.test(ttakClub.role) && /Socket\.IO/.test(ttakClub.role));
assert(/52명의 오리지널 영웅/.test(echoFront.summary) && /5v5/.test(echoFront.summary) && /Three\.js/.test(echoFront.role));

[
  [vaultClick, 'vault-click.html', 'games/vault-click/v1.0.0/', 'assets/projects/vault-click-game.png', 18, '9f711a17821fa87a4e9a7ab20624bf3f553ce77b', null, null],
  [stitchkeeper, 'stitchkeeper.html', 'games/stitchkeeper/v3.0.1/', 'assets/projects/stitchkeeper-game.png', 17, 'eb0bbc0a0348bd1f30318ef48c361cf5c09b17db', '3.0.1', stitchkeeperInventorySha256]
].forEach(([project, detailUrl, playUrl, image, testCount, sourceSha, version, pinnedInventory]) => {
  assert(project, `${detailUrl}: 프로젝트가 필요합니다.`);
  assert.strictEqual(project.url, detailUrl, `${project.id}: 카드가 상세 페이지를 열어야 합니다.`);
  assert.strictEqual(project.playUrl, playUrl, `${project.id}: 검증된 정적 런타임 URL을 별도 보존해야 합니다.`);
  assert.strictEqual(project.image, image);
  assert.strictEqual(project.kind, 'game');
  assert.strictEqual(project.collaboration, true);
  assert(!project.featured, `${project.id}: non-featured 게임이어야 합니다.`);
  assert(/BROWSER/.test(project.platform) && /STATIC SINGLE/.test(project.platform) && /OFFLINE/.test(project.platform));
  assert(new RegExp(`${testCount}/${testCount} Tests PASS`, 'i').test(project.impact));
  assert(/Canvas 2D/.test(project.role) && /authored procedural visuals/i.test(project.role));
  const releaseDir = path.join(root, playUrl);
  const expectedFiles = project.id === 'vault-click'
    ? ['build-info.json', 'index.html', 'src/game.js', 'src/rules.mjs', 'styles.css']
    : ['build-info.json', 'game-rules.js', 'game.js', 'index.html', 'styles.css'];
  assert.deepStrictEqual(listFiles(releaseDir).sort(), expectedFiles, `${project.id}: 공개 파일 allowlist가 정확해야 합니다.`);
  const info = JSON.parse(fs.readFileSync(path.join(releaseDir, 'build-info.json'), 'utf8'));
  if (version) assert.strictEqual(info.version, version);
  assert.strictEqual(info.sourceSha, sourceSha);
  assert.strictEqual(info.edition, 'static-single');
  assert.strictEqual(info.online, false);
  assert.strictEqual(info.testCount, testCount);
  const runtimeFiles = expectedFiles.filter(file => file !== 'build-info.json').sort();
  const inventory = crypto.createHash('sha256').update(runtimeFiles.map(file => {
    // GitHub Pages serves LF-normalized Git blobs; remove checkout-only carriage returns.
    const releaseBytes = fs.readFileSync(path.join(releaseDir, file), 'utf8').split(String.fromCharCode(13)).join('');
    const fileSha = crypto.createHash('sha256').update(releaseBytes).digest('hex');
    return `${fileSha}  ${file}\n`;
  }).join('')).digest('hex');
  assert.strictEqual(inventory, info.inventorySha256, `${project.id}: runtime inventory SHA-256가 일치해야 합니다.`);
  if (pinnedInventory) {
    assert.strictEqual(inventory, pinnedInventory, `${project.id}: runtime inventory must match the independently pinned verified digest.`);
  }
  const releaseIndex = fs.readFileSync(path.join(releaseDir, 'index.html'), 'utf8');
  const refs = [...releaseIndex.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
  refs.filter(ref => !ref.startsWith('data:')).forEach(ref => {
    assert(!ref.startsWith('/') && !/^https?:/i.test(ref), `${project.id}: asset reference must be relative: ${ref}`);
  });
});

[
  [vaultClick, 'vault-click.html', 'vault-title', 18, ['assets/projects/vault-click-game.png', 'assets/projects/vault-click-title.png']],
  [stitchkeeper, 'stitchkeeper.html', 'stitchkeeper-title', 17, ['assets/projects/stitchkeeper-game.png', 'assets/projects/stitchkeeper-draft.png', 'assets/projects/stitchkeeper-title.png']]
].forEach(([project, file, titleId, testCount, images]) => {
  const detail = fs.readFileSync(path.join(root, file), 'utf8');
  assert.strictEqual(project.url, file, `${file}: production card inbound link가 필요합니다.`);
  assert(/<main/.test(detail) && new RegExp(`<h1[^>]*id="${titleId}"`).test(detail));
  assert(/meta name="description"/.test(detail));
  assert(detail.includes(`href="${project.playUrl}"`) && /PLAY PUBLIC WEB BUILD/.test(detail), `${file}: 카드의 정확한 playUrl로 연결해야 합니다.`);
  assert(/href="\.\/"/.test(detail) && /포트폴리오로 돌아가기/.test(detail));
  assert(new RegExp(`${testCount}/${testCount}`).test(detail));
  assert(/STATIC SINGLE-PLAYER EDITION/.test(detail) && /서버나 온라인 기능 없이/.test(detail));
  images.forEach(image => assert(detail.includes(image) && fs.existsSync(path.join(root, image))));
  assert(/<img[^>]+alt="[^"]+"/.test(detail) && /loading="lazy"/.test(detail));
  assert(!/downloadable|multiplayer support/i.test(detail));
});
const stitchkeeperDetail = fs.readFileSync(path.join(root, 'stitchkeeper.html'), 'utf8');
const stitchkeeperPublicCopy = `${stitchkeeper.summary}\n${stitchkeeperDetail}`;
['five difficulties', '4개 재봉선', '네 재봉선', '코리도', '컷 저항', 'BUILD ONLINE']
  .forEach(phrase => assert(!stitchkeeperPublicCopy.includes(phrase), `Stitchkeeper public copy must not retain awkward phrase: ${phrase}`));
['5개 난이도', '4종 특수 솔기', '네 종류 솔기', '바느질 허용 폭', '절단 저항', '온전함', '5단계 난이도', 'ECLIPSE NIGHT · CHARM BUILD ACTIVE']
  .forEach(phrase => assert(stitchkeeperPublicCopy.includes(phrase), `Stitchkeeper public copy needs natural Korean phrasing: ${phrase}`));
['12 NIGHTS', '9 CHARMS', '4 SEAM TYPES', '17/17 TESTS PASS', '다정한 밤', '보통', '거친', '지옥', '불가능']
  .forEach(claim => assert(stitchkeeperDetail.includes(claim), `Stitchkeeper detail needs verified claim: ${claim}`));
assert(/(?:nights?\s*)?3\s*[/·,]\s*6\s*[/·,]\s*9|3·6·9/i.test(stitchkeeperDetail), 'Charm drafts must occur after nights 3/6/9.');
assert(/three|3개|3가지/i.test(stitchkeeperDetail) && /deterministic|결정론/i.test(stitchkeeperDetail) && /non-repeating|중복 없/i.test(stitchkeeperDetail));
['Plain', 'Moon', 'Ward', 'Thorn'].forEach(name => assert(stitchkeeperDetail.includes(name), `Missing seam type ${name}`));
assert(/Eclipse/i.test(stitchkeeperDetail) && /4\s*[/·,]\s*8\s*[/·,]\s*12/.test(stitchkeeperDetail));
assert(/9[^<]*(?:charms?|부적)/i.test(stitchkeeperDetail) && /five|5개|5가지/i.test(stitchkeeperDetail));
assert(/24[^<]*(?:point-cloud|포인트 클라우드)/i.test(stitchkeeperDetail));
assert(/seed/i.test(stitchkeeperDetail) && /mirror|미러/i.test(stitchkeeperDetail) && /rotation|회전/i.test(stitchkeeperDetail) && /jitter/i.test(stitchkeeperDetail) && /order|순서/i.test(stitchkeeperDetail));
assert(/moth/i.test(stitchkeeperDetail) && /speed|속도/i.test(stitchkeeperDetail) && /acceleration|가속/i.test(stitchkeeperDetail) && /score|점수/i.test(stitchkeeperDetail));
assert(/Hell\/Impossible|지옥\/불가능/.test(stitchkeeperDetail) && /intentionally extreme|의도적으로 극단적/i.test(stitchkeeperDetail));
assert(!/3막|3 Nights|12\/12|v1\.0\.0/i.test(stitchkeeperDetail), 'Stitchkeeper detail must not contain stale v1 claims.');
assert(!/v(?:2\.0\.0|3\.0\.0)|15\/15|16\/16|5 DIFFICULTIES|24 PATTERNS/i.test(stitchkeeperDetail), 'Active detail must not retain stale release labels or metrics.');
assert(!/v(?:2\.0\.0|3\.0\.0)|(?:15\/15|16\/16)/.test(JSON.stringify(stitchkeeper)), 'Active card must not retain a stale release.');
assert.strictEqual(stitchkeeper.impact, '12 Nights · 9 Charms · 4 Seam Types · 17/17 Tests PASS');
assert(fs.existsSync(path.join(root, 'games/stitchkeeper/v3.0.0/build-info.json')), 'The prior v3.0.0 artifact must remain preserved.');
assert(/<title>[^<]*3\.0\.1/.test(stitchkeeperDetail) && /STATIC WEB GAME · v3\.0\.1/.test(stitchkeeperDetail) && /STITCHKEEPER v3\.0\.1 · KNOTCRAFT/.test(stitchkeeperDetail));
assert(/constrained-viewport accessibility patch/i.test(stitchkeeperDetail));
assert(/charm HUD/i.test(stitchkeeperDetail) && /special seam labels/i.test(stitchkeeperDetail) && /(?:>=|&gt;=)10 CSS px/.test(stitchkeeperDetail) && /1264×625/.test(stitchkeeperDetail));
['Run Builds', 'Risk & Reward', 'Randomized Maps'].forEach(tag => assert(stitchkeeper.tags.includes(tag), `Stitchkeeper needs tag ${tag}`));
['12', '5개 난이도', '3·6·9', '9', '4종 특수 솔기', 'Eclipse', '24'].forEach(claim => assert(stitchkeeper.summary.includes(claim), `Stitchkeeper summary needs ${claim}`));

const stitchkeeperReleaseDir = path.join(root, 'games/stitchkeeper/v3.0.1');
const stitchkeeperRuntimeFiles = ['game-rules.js', 'game.js', 'index.html', 'styles.css'];
const stitchkeeperSourceRepo = 'C:/Users/UOU/portfolio-game-stitchkeeper';
stitchkeeperRuntimeFiles.forEach(file => {
  const deployed = fs.readFileSync(path.join(stitchkeeperReleaseDir, file), 'utf8').replace(/\r/g, '');
  const reviewedBlob = execFileSync('git', ['-C', stitchkeeperSourceRepo, 'show', `eb0bbc0a0348bd1f30318ef48c361cf5c09b17db:${file}`], { encoding: 'utf8' }).replace(/\r/g, '');
  assert.strictEqual(deployed, reviewedBlob, `Stitchkeeper ${file} must exactly match its reviewed Git blob.`);
});
function pngDimensions(file) {
  const bytes = fs.readFileSync(path.join(root, file));
  assert.strictEqual(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} needs a valid PNG signature.`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
[
  ['assets/projects/stitchkeeper-game.png', [1424, 905], 'f06677b97c46714081159a622d8894a293b43b97a4d85cc0351bcaa4f830b723'],
  ['assets/projects/stitchkeeper-title.png', [1424, 905], '70b55eb6c3d8e5bd7d4d9efccc400004ddaed64ca8a3488860aeae76991959a2'],
  ['assets/projects/stitchkeeper-draft.png', [1424, 905], 'ba11ca984f64998d241a06a82d523362a15a2c1731ac030f823467402e2ceb32']
].forEach(([file, dimensions, sha256]) => {
  assert.deepStrictEqual(pngDimensions(file), dimensions);
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), sha256, `${file} must match the refreshed verified smoke artifact crop.`);
});
['stitchkeeper-game.png', 'stitchkeeper-title.png', 'stitchkeeper-draft.png'].forEach(file => {
  const tag = stitchkeeperDetail.match(new RegExp(`<img[^>]+src="assets/projects/${file}"[^>]*>`));
  assert(tag && /alt="[^"]+"/.test(tag[0]), `${file} needs accurate nonempty alt text.`);
  if (file !== 'stitchkeeper-game.png') assert(/loading="lazy"/.test(tag[0]), `${file} should lazy-load.`);
});
const ttakReleaseRelative = 'games/ttak-club/v1.0.3';
const ttakReleaseDir = path.join(root, ttakReleaseRelative);
const ttakReleaseFiles = [
  'TTAK-Table-Club-v1.0.3-itch.zip',
  'build-info.json',
  'css/pigments.css',
  'css/style.css',
  'icon.svg',
  'index.html',
  'js/app.js',
  'manifest.webmanifest',
  'shared/ai.js',
  'shared/physics.js',
  'shared/rules.js',
  'sw.js'
];
function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute, base) : [path.relative(base, absolute).replace(/\\/g, '/')];
  });
}
assert(fs.existsSync(ttakReleaseDir), `${ttakReleaseRelative}: 공개 릴리스 디렉터리가 필요합니다.`);
assert.deepStrictEqual(listFiles(ttakReleaseDir).sort(), ttakReleaseFiles);
const ttakBuildInfo = JSON.parse(fs.readFileSync(path.join(ttakReleaseDir, 'build-info.json'), 'utf8'));
assert.deepStrictEqual(ttakBuildInfo, {
  version: '1.0.3',
  sourceSha: '6fa828c92869532b1dac99e7b6e6373e28da64cd',
  edition: 'static-single-local',
  online: false,
  testCount: 119,
  inventorySha256: '6121c8847d2958dd73961bfceecf9db562f00c04085561e100975044a9b5b705'
});
const ttakRuntimeFiles = ttakReleaseFiles.filter(file => file !== 'build-info.json' && !file.endsWith('.zip')).sort();
const ttakInventory = crypto.createHash('sha256').update(ttakRuntimeFiles.map(file => {
  const releaseBytes = fs.readFileSync(path.join(ttakReleaseDir, file), 'utf8').split(String.fromCharCode(13)).join('');
  const fileSha = crypto.createHash('sha256').update(releaseBytes).digest('hex');
  return `${fileSha}  ${file}\n`;
}).join('')).digest('hex');
assert.strictEqual(ttakInventory, ttakBuildInfo.inventorySha256, 'deployed TTAK runtime files must match the verified inventory');
const ttakZip = fs.readFileSync(path.join(ttakReleaseDir, 'TTAK-Table-Club-v1.0.3-itch.zip'));
assert.strictEqual(crypto.createHash('sha256').update(ttakZip).digest('hex'), '051c88475bdc072d8ad2ab61013e505436416d407af843763ce3a5447a16d6bd');
const ttakReleaseIndex = fs.readFileSync(path.join(ttakReleaseDir, 'index.html'), 'utf8');
['./manifest.webmanifest', './css/style.css', './css/pigments.css', './shared/physics.js', './shared/rules.js', './shared/ai.js', './js/app.js']
  .forEach(asset => assert(ttakReleaseIndex.includes(asset), `TTAK release index must use relative asset ${asset}`));
assert(!/socket\.io|<script[^>]+src=["'](?:https?:)?\/\//i.test(ttakReleaseIndex), 'TTAK static index must not load a socket or remote script.');
assert(!/data-flow=["']online["']|id=["'](?:onlineBox|createRoom|joinRoom|copyCode)["']/i.test(ttakReleaseIndex), 'TTAK static index must not expose online-only DOM.');
assert(/id=["']language["']/.test(ttakReleaseIndex) && /id=["']staticOnlineTitle["']/.test(ttakReleaseIndex), 'TTAK static release needs language and disabled-online UI.');
const ttakReleaseApp = fs.readFileSync(path.join(ttakReleaseDir, 'js/app.js'), 'utf8');
['ttak:language', 'Knock every opponent stone off the board.', 'Online rooms unavailable', '● Static build']
  .forEach(text => assert(ttakReleaseApp.includes(text), `TTAK release app needs bilingual contract: ${text}`));
assert(ttakReleaseApp.includes("easy:'쉬움'") && ttakReleaseApp.includes("easy:'Easy'") && !ttakReleaseApp.includes('uneasy:'), 'TTAK static runtime must preserve Korean/English difficulty keys');
assert(!/\bio\(\)|\bsocket\b|onlineAction|roomCode|myId|#onlineBox|data-flow=["']online["']|setupOnline|onlineEntry|copyCode|room:(?:create|join|state)|game:(?:shot|snapshot|event|turn)/.test(ttakReleaseApp), 'TTAK static runtime must not ship online or Socket.IO code');
assert(/single\/local/i.test(ttakClub.impact) && /v1\.0\.3/.test(ttakClub.impact) && /119\/119/.test(ttakClub.impact));
const ttakDetailRelease = fs.readFileSync(path.join(root, 'ttak-club.html'), 'utf8');
assert(/href="games\/ttak-club\/v1\.0\.3\/"/.test(ttakDetailRelease), 'TTAK detail needs the exact Play link.');
assert(/href="games\/ttak-club\/v1\.0\.3\/TTAK-Table-Club-v1\.0\.3-itch\.zip"/.test(ttakDetailRelease), 'TTAK detail needs the exact itch ZIP link.');
assert(/static release supports single\/local/i.test(ttakDetailRelease) && /online rooms (?:need|require) (?:the )?server build/i.test(ttakDetailRelease));
['7모드 승부판정 패널', '금 가까이 1회씩 최종 위치 판정', '열린 상단 아웃', 'visible-board outs', 'deadlock-safe terminal rules']
  .forEach(fix => assert(ttakDetailRelease.includes(fix), `TTAK detail needs release fix: ${fix}`));
assert(/data-project-id="echo-front"[^}]+object-position:20% 50%/.test(css), 'ECHO FRONT 카드 crop은 왼쪽 타이틀 로고를 보존해야 합니다.');
['assets/projects/ttak-club.png', 'assets/projects/ttak-club-home.png', 'assets/projects/echo-front.png', 'assets/projects/echo-front-draft.png']
  .forEach(image => assert(fs.existsSync(path.join(root, image)), `${image}: 실제 스크린샷이 필요합니다.`));
[
  ['ttak-club.html', 'ttak-title', ['7개 모드', '119/119', '결정론적', 'Socket.IO', 'PUBLIC WEB', 'ITCH BUILD v1.0.3', 'assets/projects/ttak-club.png', 'assets/projects/ttak-club-home.png']],
  ['echo-front.html', 'echo-title', ['52', '14 Tank', '24 Damage', '14 Support', '9개', '11개', '15초', '96/96', 'Three.js', 'Socket.IO', '공개 플레이 서버나 다운로드를 제공하지 않습니다', 'assets/projects/echo-front.png', 'assets/projects/echo-front-draft.png']]
].forEach(([file, titleId, facts]) => {
  const detailPath = path.join(root, file);
  assert(fs.existsSync(detailPath), `${file}: 상세 페이지가 필요합니다.`);
  const detail = fs.readFileSync(detailPath, 'utf8');
  facts.forEach(fact => assert(detail.includes(fact), `${file}: ${fact} 정보가 필요합니다.`));
  assert(/<main/.test(detail) && new RegExp(`<h1[^>]*id="${titleId}"`).test(detail), `${file}: semantic main과 제목이 필요합니다.`);
  assert(/meta name="description"/.test(detail), `${file}: SEO 설명이 필요합니다.`);
  assert(/<a[^>]+href="\.\/"[^>]*>[^<]*(포트폴리오|돌아가기)/.test(detail), `${file}: 포트폴리오 복귀 링크가 필요합니다.`);
  assert(/loading="lazy"/.test(detail), `${file}: 하단 갤러리는 지연 로드해야 합니다.`);
});
const echoDetail = fs.readFileSync(path.join(root, 'echo-front.html'), 'utf8');
assert(/alt="ECHO FRONT 타이틀과 온라인 작전·바로 연습 메뉴가 배치된 실제 홈 포스터 화면"/.test(echoDetail), 'ECHO FRONT hero 대체 텍스트는 실제 스크린샷 내용을 정확히 설명해야 합니다.');
const realDriveDetailPath = path.join(root, 'realdrive-horizon.html');
assert(fs.existsSync(realDriveDetailPath), 'RealDrive Horizon 상세 페이지가 필요합니다.');
const realDriveDetail = fs.readFileSync(realDriveDetailPath, 'utf8');
[
  '개발 중', '자유로운 차량 파손', '31대', '6개 지역', '수리비', '주말 페스티벌',
  'assets/projects/realdrive-horizon.png',
  'assets/projects/realdrive-horizon-garage.png',
  'assets/projects/realdrive-horizon-map.png'
].forEach(text => assert(realDriveDetail.includes(text), `RealDrive 상세 페이지에 ${text} 정보가 필요합니다.`));
assert(/아직 공개 다운로드를 제공하지 않습니다/.test(realDriveDetail), '개발 중인 게임을 공개된 것처럼 보이면 안 됩니다.');
assert(/29개 프로젝트/.test(html), '공유 메타 설명의 프로젝트 수를 29개로 동기화해야 합니다.');
assert(/realdrive-detail/.test(css), 'RealDrive 상세 페이지 전용 반응형 스타일이 필요합니다.');
assert(/@media\(max-width:900px\)\{\.rd-hero\{grid-template-columns:minmax\(0,1fr\)/.test(css), '모바일 1열 hero는 큰 이미지 때문에 viewport를 넘지 않아야 합니다.');
assert(/prefers-reduced-motion/.test(css), '상세 페이지도 모션 감소 접근성을 유지해야 합니다.');
assert(/<a[^>]+href="\.\/"[^>]*>[^<]*(포트폴리오|돌아가기)/.test(realDriveDetail), '상세 페이지에서 포트폴리오로 돌아갈 수 있어야 합니다.');
assert(/<main/.test(realDriveDetail) && /<h1[^>]*id="realdrive-title"[^>]*>[\s\S]*?RealDrive[\s\S]*?Horizon[\s\S]*?<\/h1>/.test(realDriveDetail), '상세 페이지에 semantic main과 단일 프로젝트 제목이 필요합니다.');
assert(/meta name="description"/.test(realDriveDetail), '상세 페이지에 검색·공유 설명이 필요합니다.');
assert(/loading="lazy"/.test(realDriveDetail), '하단 갤러리 이미지는 지연 로드해야 합니다.');
assert(/18,?000|1\.8만/.test(projects.find(p => p.id === 'magic-brick').impact));
assert(/2인|2-person/i.test(projects.find(p => p.id === 'make-tteok').impact));
assert(/1시간|60\s*minute/i.test(projects.find(p => p.id === 'neon-dash-waves').impact));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/lotto-signal-lab/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/korea-atmosphere-live/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/bluetooth-shower-playground/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/cyber-air-conditioner/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/click-fireworks/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/mosquito-hunt/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/character-vault/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/infinite-cat-desk/'));
assert(projects.some(p => p.url === 'https://do0rian.itch.io/hotdog-street-empire'));
const lifeHelp = projects.find(p => p.id === 'hannun-life-help');
assert(lifeHelp, '한눈 생활도움 프로젝트가 필요합니다.');
assert.strictEqual(lifeHelp.url, 'https://woo12345678.github.io/hannun-life-help/');
assert.strictEqual(lifeHelp.image, 'assets/projects/hannun-life-help.png');
assert(/광고/.test(lifeHelp.summary + lifeHelp.impact), '광고 문의 수익 모델을 표시해야 합니다.');
assert(/6\/6/.test(lifeHelp.impact), '검증된 테스트 수를 표시해야 합니다.');
const playlog = projects.find(p => p.id === 'playlog');
assert(playlog, 'PLAYLOG 프로젝트가 필요합니다.');
assert.strictEqual(playlog.url, 'https://woo12345678.github.io/playlog/');
assert.strictEqual(playlog.image, 'assets/projects/playlog.png');
assert(/618 Game DB/.test(playlog.impact), 'PLAYLOG의 검증된 게임 지식 DB 규모를 표시해야 합니다.');
assert(/Nostalgia \+232/.test(playlog.impact), 'PLAYLOG의 추억 게임 232개 확장을 표시해야 합니다.');
assert(/Web\/Flash 108/.test(playlog.impact), 'PLAYLOG의 Web·Flash 게임 108개를 표시해야 합니다.');
assert(/Steam \+100/.test(playlog.impact), 'PLAYLOG의 Steam 인기 신규 100개를 표시해야 합니다.');
assert(/Mobile \+50/.test(playlog.impact), 'PLAYLOG의 모바일 인기 신규 50개를 표시해야 합니다.');
assert(/Switch \+50/.test(playlog.impact), 'PLAYLOG의 Nintendo 신규 50개를 표시해야 합니다.');
assert(/5-Game Live News/.test(playlog.impact), 'PLAYLOG의 최대 5게임 라이브 소식을 표시해야 합니다.');
assert(/47\/47/.test(playlog.impact), 'PLAYLOG의 통과 테스트 수를 표시해야 합니다.');
assert(/618/.test(playlog.summary) && /Web\/Flash.*108/.test(playlog.summary), 'PLAYLOG summary 수치도 동기화해야 합니다.');
assert(/618/.test(playlog.role) && /Web\/Flash.*108/.test(playlog.role), 'PLAYLOG role 수치도 동기화해야 합니다.');
assert(playlog.tags.includes('Memory Finder'), 'PLAYLOG 추억 게임 찾기를 표시해야 합니다.');
assert(playlog.tags.includes('Live News'), 'PLAYLOG 뉴스·이벤트·YouTube 피드를 표시해야 합니다.');
assert(playlog.tags.includes('Auto Refresh'), 'PLAYLOG 자동 소식 갱신을 표시해야 합니다.');
assert(playlog.tags.includes('Custom Game Entry'), 'PLAYLOG 사용자 게임 추가 기능을 표시해야 합니다.');
const ladybugGarden = projects.find(p => p.id === 'ladybug-garden');
assert(ladybugGarden, 'Ladybug Garden 프로젝트가 필요합니다.');
assert.strictEqual(ladybugGarden.url, 'https://woo12345678.github.io/do0rian-portfolio/games/ladybug-garden/1a98be2/');
assert.strictEqual(ladybugGarden.image, 'assets/projects/ladybug-garden.png');
assert(/v1\.1\.2/.test(ladybugGarden.impact), 'Ladybug Garden 최신 공개 버전을 표시해야 합니다.');
assert(/1a98be2/.test(ladybugGarden.impact), 'Ladybug Garden 최신 전체화면 빌드 ID를 표시해야 합니다.');
assert(/FULLSCREEN BUILD/.test(ladybugGarden.platform), 'Ladybug Garden 카드에 전체화면 빌드를 노출해야 합니다.');
assert(/77\/77/.test(ladybugGarden.impact), 'Ladybug Garden 최신 테스트 수를 표시해야 합니다.');
assert(ladybugGarden.tags.includes('Mobile Fullscreen'), 'Ladybug Garden 모바일 전체화면 지원을 표시해야 합니다.');
const embeddedLadybugIndex = fs.readFileSync(path.join(root, 'games/ladybug-garden/1a98be2/index.html'), 'utf8');
assert(embeddedLadybugIndex.includes('index-B2wdraPW.js'), '포트폴리오에는 최신 Ladybug 전체화면 배포 산출물이 포함되어야 합니다.');

['hero', 'selectedWork', 'projectArchive', 'process', 'about'].forEach(id => assert(html.includes(`id="${id}"`), `${id} 섹션이 필요합니다.`));
assert(html.includes('id="ambientCanvas"'), '히어로 앰비언트 캔버스가 필요합니다.');
assert(html.includes('id="projectGrid"'), '확장 가능한 프로젝트 그리드가 필요합니다.');
assert(html.indexOf('projects.js') < html.indexOf('app.js'), '프로젝트 데이터는 앱보다 먼저 로드되어야 합니다.');
assert(css.includes('prefers-reduced-motion'), '모션 감소 접근성을 지원해야 합니다.');
console.log(`PASS: ${projects.length} projects, ${featured.length} featured case studies, extensible portfolio shell`);

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const projects = require('../projects.js');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.strictEqual(projects.length, 27, '포트폴리오에는 현재 27개 프로젝트가 있어야 합니다.');
assert.strictEqual(new Set(projects.map(p => p.id)).size, projects.length, '프로젝트 ID는 고유해야 합니다.');
projects.forEach(project => {
  ['id', 'title', 'url', 'image', 'kind', 'summary'].forEach(key => assert(project[key], `${project.id || 'project'}: ${key} 필드가 필요합니다.`));
  assert(/^https:\/\//.test(project.url), `${project.id}: 공개 HTTPS 링크가 필요합니다.`);
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
assert.deepStrictEqual(projects.slice(3, 6).map(p => p.id), ['realdrive-horizon', 'ttak-club', 'echo-front'], '두 게임은 RealDrive 바로 다음, 비게임 프로젝트 전에 정확한 순서로 있어야 합니다.');
[
  [ttakClub, 'https://woo12345678.github.io/do0rian-portfolio/ttak-club.html', 'assets/projects/ttak-club-home.png', /7 Modes/, /83\/83/],
  [echoFront, 'https://woo12345678.github.io/do0rian-portfolio/echo-front.html', 'assets/projects/echo-front.png', /52 Heroes.*9 Modes.*11 Maps/, /96\/96/]
].forEach(([project, url, image, scope, tests]) => {
  assert(project, `${url}: 프로젝트가 필요합니다.`);
  assert.strictEqual(project.url, url);
  assert.strictEqual(project.image, image);
  assert.strictEqual(project.kind, 'game');
  assert.strictEqual(project.collaboration, true);
  assert(!project.featured, `${project.id}: featured로 표시하면 안 됩니다.`);
  assert(/LOCAL BUILD/.test(project.platform) && /SERVER REQUIRED/.test(project.platform), `${project.id}: 로컬 서버 필요 상태를 표시해야 합니다.`);
  assert(scope.test(project.impact) && tests.test(project.impact), `${project.id}: 검증된 범위와 테스트 수가 필요합니다.`);
});
assert(/결정론적/.test(ttakClub.summary) && /Canvas 2D/.test(ttakClub.role) && /Socket\.IO/.test(ttakClub.role));
assert(/52명의 오리지널 영웅/.test(echoFront.summary) && /5v5/.test(echoFront.summary) && /Three\.js/.test(echoFront.role));
assert(/data-project-id="echo-front"[^}]+object-position:20% 50%/.test(css), 'ECHO FRONT 카드 crop은 왼쪽 타이틀 로고를 보존해야 합니다.');
['assets/projects/ttak-club.png', 'assets/projects/ttak-club-home.png', 'assets/projects/echo-front.png', 'assets/projects/echo-front-draft.png']
  .forEach(image => assert(fs.existsSync(path.join(root, image)), `${image}: 실제 스크린샷이 필요합니다.`));
[
  ['ttak-club.html', 'ttak-title', ['7개 모드', '83/83', '결정론적', 'Socket.IO', '로컬 플레이 가능 빌드', '공개 다운로드를 제공하지 않습니다', 'assets/projects/ttak-club.png', 'assets/projects/ttak-club-home.png']],
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
assert(/27개 프로젝트/.test(html), '공유 메타 설명의 프로젝트 수를 27개로 동기화해야 합니다.');
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

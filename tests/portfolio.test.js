const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const projects = require('../projects.js');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.strictEqual(projects.length, 18, '포트폴리오에는 현재 18개 공개 프로젝트가 있어야 합니다.');
assert.strictEqual(new Set(projects.map(p => p.id)).size, projects.length, '프로젝트 ID는 고유해야 합니다.');
projects.forEach(project => {
  ['id', 'title', 'url', 'image', 'kind', 'summary'].forEach(key => assert(project[key], `${project.id || 'project'}: ${key} 필드가 필요합니다.`));
  assert(/^https:\/\//.test(project.url), `${project.id}: 공개 HTTPS 링크가 필요합니다.`);
  assert(Array.isArray(project.tags) && project.tags.length, `${project.id}: 태그가 필요합니다.`);
  assert(fs.existsSync(path.join(root, project.image)), `${project.id}: 대표 이미지 파일이 실제로 존재해야 합니다.`);
});

const featured = projects.filter(p => p.featured);
assert.deepStrictEqual(featured.map(p => p.id), ['magic-brick', 'make-tteok', 'neon-dash-waves']);
assert(/18,?000|1\.8만/.test(projects.find(p => p.id === 'magic-brick').impact));
assert(/2인|2-person/i.test(projects.find(p => p.id === 'make-tteok').impact));
assert(/1시간|60\s*minute/i.test(projects.find(p => p.id === 'neon-dash-waves').impact));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/lotto-signal-lab/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/korea-atmosphere-live/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/bluetooth-shower-playground/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/cyber-air-conditioner/'));
assert(projects.some(p => p.url === 'https://woo12345678.github.io/click-fireworks/'));
assert(projects.some(p => p.url === 'https://do0rian.itch.io/hotdog-street-empire'));

['hero', 'selectedWork', 'projectArchive', 'process', 'about'].forEach(id => assert(html.includes(`id="${id}"`), `${id} 섹션이 필요합니다.`));
assert(html.includes('id="ambientCanvas"'), '히어로 앰비언트 캔버스가 필요합니다.');
assert(html.includes('id="projectGrid"'), '확장 가능한 프로젝트 그리드가 필요합니다.');
assert(html.indexOf('projects.js') < html.indexOf('app.js'), '프로젝트 데이터는 앱보다 먼저 로드되어야 합니다.');
assert(css.includes('prefers-reduced-motion'), '모션 감소 접근성을 지원해야 합니다.');
console.log(`PASS: ${projects.length} projects, ${featured.length} featured case studies, extensible portfolio shell`);

# DOORIAN Portfolio

독립 게임 개발자 DOORIAN의 반응형 인터랙티브 포트폴리오입니다.

## 실행

```bash
npm start
```

브라우저에서 `http://127.0.0.1:4174`를 엽니다.

## 테스트

```bash
npm test
```

## 새 프로젝트 추가

1. 대표 이미지를 `assets/projects/`에 저장합니다.
2. `projects.js` 배열 끝에 기존 객체와 같은 형식의 프로젝트 객체를 추가합니다.
3. 대표 사례로 크게 노출하려면 `featured: true`, `index`, `narrative`를 추가합니다.
4. `npm test`를 실행합니다.

프로젝트 그리드, 필터 결과 수, 태그와 링크는 데이터에서 자동 생성됩니다.

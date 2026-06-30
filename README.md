# 요가 해부학 레이어 뷰어

전신 골격·근육을 **피부 → 근육 → 뼈**로 겹겹이 벗겨 보고, 근육을 클릭하면
한글 이름·기능·관련 아사나가 뜨는 3D 뷰어. Vite + react-three-fiber.

실제 해부 데이터는 **Z-Anatomy / BodyParts3D**(CC BY-SA)에서 가져와
`muscles.glb` / `skeleton.glb`로 넣으면 됩니다.

---

## 1. 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 모델 파일이 없으면 안내 화면이 뜹니다.
`public/models/`에 glb를 넣으면 자동으로 로드돼요.

| 파일 | 레이어 | 필요 |
|---|---|---|
| `public/models/muscles.glb` | 근육 | 필수 |
| `public/models/skeleton.glb` | 골격 | 필수 |
| `public/models/surface.glb` | 피부 | 선택 |

---

## 2. Z-Anatomy에서 glb 뽑기

1. **Blender 설치** (무료) 후, `https://www.z-anatomy.com/` 또는 GitHub
   `github.com/Z-Anatomy` 에서 `.blend` 파일을 받아 엽니다.
2. 우측 **아웃라이너(Outliner)**에 시스템별 컬렉션이 있어요
   (Skeletal / Muscular / Nervous / Vessels …).
3. **근육만 내보내기**
   - 다른 컬렉션은 눈 아이콘으로 숨기고 **Muscular 컬렉션만** 보이게 둡니다.
   - `A`로 보이는 객체 전체 선택.
   - `File ▸ Export ▸ glTF 2.0 (.glb/.gltf)`
   - 내보내기 패널 설정:
     - **Format: glTF Binary (.glb)**
     - **Include ▸ Selected Objects** (또는 Visible Objects) 체크
     - **Compression(Draco) 끄기** ← 이거 켜면 이 앱에서 디코더가 필요해요
   - 파일명을 `muscles.glb`로 저장.
4. **골격 내보내기**: Skeletal 컬렉션만 보이게 하고 같은 방식으로 `skeleton.glb`.
5. (선택) 피부/표면 메시가 있으면 `surface.glb`로.
6. 세 파일을 `public/models/`에 복사 → `npm run dev`.

> **무겁다면**: 신경/혈관 컬렉션은 빼고, 근육은 Blender의
> `Decimate` 모디파이어로 폴리곤을 줄이면 로딩이 빨라집니다.
> 처음엔 상·하체 일부만 넣어 테스트해도 됩니다.

---

## 3. 근육 이름 ↔ 한글 정보 매핑

Z-Anatomy 메시 이름은 라틴/영어예요(예: `Deltoid`, `Pectoralis_major`).
`src/muscles.js`가 이 이름을 키워드로 대조해 한글 카드(이름·기능·아사나)를 띄웁니다.

- 클릭했는데 "매핑 데이터 없음"이 뜨면, **개발자 콘솔**에 찍힌
  `[picked mesh] <이름>`을 확인하세요.
- 해당 근육 항목의 `matchers` 배열에 그 이름 키워드를 추가하면 다음부터 인식합니다.
- 새 근육을 통째로 추가하려면 `MUSCLES` 배열에 `{ id, ko, la, group, func, asanas, matchers }`
  한 칸 더 넣으면 끝.

기본 제공: 승모근·삼각근·대흉근·상완이두/삼두근·흉쇄유돌근·복직근·복사근·장요근·
척추기립근·광배근·대둔근·대퇴사두근·햄스트링·내전근·비복근 (총 16개).

---

## 4. 조작

- 드래그(1손가락): 회전 · 스크롤/핀치: 확대 · 우클릭 드래그: 이동
- 왼쪽(모바일 아래) **깊이 슬라이더**: 피부→근육→뼈 피어
- **피부 / 근육 / 뼈** 칩: 해당 층으로 점프
- **근육 클릭**: 정보 카드 / 카드 ✕ 또는 빈 곳 클릭으로 닫기

---

## 5. 라이선스

3D 데이터(Z-Anatomy, BodyParts3D)는 **CC BY-SA 4.0**입니다.
개인 학습용은 자유롭게 쓰면 되고, 공개·배포 시 **출처 표기 + 동일조건 변경허락**이
필요합니다. 이 앱 코드 자체는 자유롭게 수정해 쓰세요.

- Z-Anatomy: https://www.z-anatomy.com/
- BodyParts3D / Anatomography (라이프사이언스 통합DB센터, 일본)

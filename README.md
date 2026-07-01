# 요가 해부학 레이어 뷰어

전신 골격·근육을 **피부 → 근육 → 뼈**로 겹겹이 벗겨 보고, 근육을 클릭하면
한글 이름·기능·관련 아사나가 뜨는 3D 뷰어. Vite + react-three-fiber.

실제 해부 데이터(**Z-Anatomy / BodyParts3D**, CC BY-SA)가 이미
`public/models/`에 포함돼 있습니다 — 받자마자 바로 실행됩니다.
모델은 Draco 압축되어 있고(근육 5MB·골격 7MB), 디코더는 `public/draco/`에 동봉.

---

## 1. 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 모델이 이미 들어 있어 바로 보입니다.

**정보 수정 제안 기능(편집 모드)** — 기본은 숨겨져 있고, URL에 `?edit`를 붙이거나
(`http://localhost:5173/?edit`) 앱에서 **Alt+Shift+E** 를 누르면 나타납니다.
쓰려면 로컬 DB 서버를 함께 켭니다:

```bash
npm run server        # 수정요청 DB 서버 (localhost:3001, server/suggestions.json에 저장)
# 또는 한 번에:  npm run dev:all
```

편집 모드에서 카드의 **✎ 정보 수정 제안**으로 제출하면 서버에 쌓이고, 좌하단 **✎ 받은 제안**에서
목록·처리 상태를 볼 수 있습니다. (일반 방문자에겐 노출되지 않으며, 서버 없이도 앱은 정상 동작합니다.)

| 파일 | 레이어 | 상태 |
|---|---|---|
| `public/models/muscles.glb` | 근육 (789개 메시) | ✅ 포함 (Draco) |
| `public/models/skeleton.glb` | 골격 (1244개 메시) | ✅ 포함 (Draco) |
| `public/models/surface.glb` | 피부 | ✅ 포함 (Draco) |
| `public/draco/` | Draco 디코더 | ✅ 동봉 |

---

## 2. 모델 다시 만들기 (이미 포함돼 있어 보통은 불필요)

현재 glb는 **Z-Anatomy `Startup.blend`** 의 `Muscular system` /
`Skeletal system` 컬렉션을 export 한 것입니다. 더 가볍게/다르게 뽑고 싶을 때만 참고하세요.

### 2-A. 자동(헤드리스, Blender 설치 불필요)

이 저장소를 만들 때 쓴 방법. 파이썬으로 Blender를 모듈(`bpy`)로 돌려 변환합니다.

```bash
pip install bpy                     # Blender를 파이썬 모듈로 (≈370MB)
# Z-Anatomy 모델 받기
curl -LO https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip
unzip Z-Anatomy.zip                 # → Z-Anatomy/Startup.blend
# scripts/export_glb.py 로 muscles.glb / skeleton.glb 생성 (Draco on)
python scripts/export_glb.py Z-Anatomy/Startup.blend public/models
```

`scripts/export_glb.py`는 `Muscular system` · `Skeletal system` 컬렉션만 골라
Draco 압축 glb로 내보냅니다. 다른 컬렉션(혈관·신경 등)을 추가하려면 그 안의 `TARGETS`만 고치면 됩니다.

### 2-B. 수동(Blender GUI)

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
     - **Compression(Draco)**: 켜도 됨 — 디코더가 `public/draco/`에 동봉돼 있어요
       (끄면 파일이 커지지만 그대로 동작)
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

기본 제공 **185종** — 모델의 거의 모든 근육을 개별 매핑(그룹 퉁치기 없음). 표정·눈·턱·설골·인두·손발
내재근까지 클릭하면 이름이 뜹니다. 요가 핵심 근육 예:
- **목**: 흉쇄유돌근·사각근·광경근·견갑거근·머리/목널판근·목긴근·머리긴근
- **어깨·회전근개**: 승모근·삼각근·극상/극하/견갑하/소원근·대원근·마름근(대/소)·전거근·후거근
- **가슴·팔**: 대/소흉근·상완이두/삼두근·상완근·상완요골근·회외근·전완 굴근(요/척측수근굴근·장장근·천/심지굴근·원/방형회내근)
- **코어·허리**: 복직근·외/내복사근·복횡근·추체근·요방형근·척추기립근(장늑근·최장근·극근)·반극근·다열근·장요근
- **호흡근**: 횡격막·늑간근·후거근
- **골반저(물라 반다)**: 치골미골근·장골미골근·미골근
- **엉덩이·심부 고관절**: 대/중/소둔근·이상근·대퇴근막장근·상/하쌍둥이근·대퇴방형근·내/외폐쇄근
- **허벅지**: 대퇴사두(대퇴직근·외/내측·중간광근)·봉공근·햄스트링(대퇴이두·반건양·반막양근)·내전근(대/장/단내전근·박근·치골근)
- **종아리·발**: 비복근·가자미근·장딴지빗근·오금근·전/후경골근·긴/짧은/셋째종아리근
- **후두(우자이·잘란다라 반다)**: 윤상갑상근·뒤/가쪽반지피열근·피열근·피열후두개근·갑상피열근

> 메시 이름은 라틴/영어 풀네임(예: `Rectus abdominis muscle`, `Diaphragm`)이라
> 클릭하면 자동 매핑됩니다. 근막·널힘줄 등 결합조직은 근육을 가리므로 기본으로 숨깁니다.

화면 우상단 **🔍 근육 검색**(단축키 `/`)으로 한글명·라틴명·부위로 찾아 카드를 바로 열 수도 있습니다.

---

## 4. 조작

- 드래그(1손가락): 회전 · 스크롤/핀치: 확대 · 우클릭 드래그: 이동
- 왼쪽(모바일 아래) **피부 / 근육 / 뼈 체크박스**: 각 레이어를 켜고 끔 (겹치면 바깥 레이어가 반투명)
- **Spacebar + 드래그**: 모델 위치 이동 · **🔪 벗기기**: 근육 클릭해 벗기기 · **🫁 호흡근**
- **근육 클릭**: 정보 카드 / 카드 ✕ 또는 빈 곳 클릭으로 닫기

---

## 5. 라이선스

3D 데이터(Z-Anatomy, BodyParts3D)는 **CC BY-SA 4.0**입니다.
개인 학습용은 자유롭게 쓰면 되고, 공개·배포 시 **출처 표기 + 동일조건 변경허락**이
필요합니다. 이 앱 코드 자체는 자유롭게 수정해 쓰세요.

- Z-Anatomy: https://www.z-anatomy.com/
- BodyParts3D / Anatomography (라이프사이언스 통합DB센터, 일본)

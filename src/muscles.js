// ──────────────────────────────────────────────────────────────────────────
// 근육 메타데이터 + 메시 이름 매칭
//
// Z-Anatomy / BodyParts3D 에서 export 한 glb 의 메시 이름은 라틴/영어야
// (예: "Deltoid", "Pectoralis_major", "Biceps_brachii" ...).
// 클릭한 메시의 이름을 matchers 의 키워드와 대조해서 아래 한글 정보를 띄워.
//
// 내보낸 모델의 실제 메시 이름이 다르면, 콘솔에 찍히는 이름(앱 우하단 "이름 보기"
// 또는 클릭 시 콘솔 로그)을 보고 해당 항목 matchers 에 키워드만 추가하면 돼.
// ──────────────────────────────────────────────────────────────────────────

export const MUSCLES = [
  {
    id: "trapezius", ko: "승모근", la: "Trapezius", group: "등 · 어깨",
    func: "견갑골을 끌어올리고 모으며 안정시킨다. 목을 펴고 머리를 받친다.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["우스트라아사나", "Ustrasana"]],
    matchers: ["trapez"],
  },
  {
    id: "deltoid", ko: "삼각근", la: "Deltoideus", group: "어깨",
    func: "팔을 옆·앞·뒤로 들어 올린다(외전·굴곡·신전). 어깨 윤곽을 만든다.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["핀차 마유라아사나", "Pincha Mayurasana"]],
    matchers: ["deltoid"],
  },
  {
    id: "pectoralis", ko: "대흉근", la: "Pectoralis major", group: "가슴",
    func: "팔을 몸 앞·안쪽으로 모으고 안으로 돌린다. 미는 동작의 주동근.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["가루다아사나", "Garudasana"]],
    matchers: ["pectoralis major", "pectoralis_major", "pectoralis"],
  },
  {
    id: "biceps", ko: "상완이두근", la: "Biceps brachii", group: "팔",
    func: "팔꿈치를 굽히고 손바닥을 위로 돌린다(회외).",
    asanas: [["바카아사나", "Bakasana"], ["고무카아사나", "Gomukhasana"]],
    matchers: ["biceps brachii", "biceps_brachii"],
  },
  {
    id: "triceps", ko: "상완삼두근", la: "Triceps brachii", group: "팔",
    func: "팔꿈치를 곧게 편다. 체중 지지 동작에서 핵심.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["triceps brachii", "triceps_brachii", "triceps"],
  },
  {
    id: "sternocleidomastoid", ko: "흉쇄유돌근", la: "Sternocleidomastoideus", group: "목",
    func: "머리를 반대쪽으로 돌리고, 양쪽이 함께 목을 앞으로 굽힌다.",
    asanas: [["마츠야아사나", "Matsyasana"], ["살람바 사르방가아사나", "Salamba Sarvangasana"]],
    matchers: ["sternocleidomastoid", "sternocleido"],
  },
  {
    id: "rectus_abdominis", ko: "복직근", la: "Rectus abdominis", group: "코어",
    func: "척추를 앞으로 굽히고 골반과 흉곽을 끌어당긴다. 코어 안정의 표층.",
    asanas: [["나바아사나", "Navasana"], ["팔라카아사나", "Phalakasana"]],
    matchers: ["rectus abdominis", "rectus_abdominis"],
  },
  {
    id: "obliques", ko: "복사근", la: "Obliquus ext./int.", group: "코어",
    func: "몸통을 비틀고 옆으로 굽힌다. 복압을 만들어 허리를 보호.",
    asanas: [["파리브르타 트리코나아사나", "Parivrtta Trikonasana"], ["바시스타아사나", "Vasisthasana"]],
    matchers: ["obliquus exter", "obliquus inter", "external oblique", "internal oblique", "abdominal_external", "oblique"],
  },
  {
    id: "iliopsoas", ko: "장요근", la: "Iliopsoas", group: "코어 · 고관절(심부)",
    func: "고관절을 굽히고 요추를 안정시키는 심부 코어. 다리를 들어 올린다.",
    asanas: [["비라바드라아사나 I", "Virabhadrasana I"], ["안자네야아사나", "Anjaneyasana"]],
    matchers: ["iliopsoas", "psoas", "iliacus"],
  },
  {
    id: "erector_spinae", ko: "척추기립근", la: "Erector spinae", group: "등(심부)",
    func: "척추를 곧게 펴고 자세를 지탱한다. 후굴의 주동근.",
    asanas: [["부장가아사나", "Bhujangasana"], ["살라바아사나", "Salabhasana"]],
    matchers: ["erector spinae", "erector_spinae", "iliocostalis", "longissimus", "spinalis"],
  },
  {
    id: "latissimus", ko: "광배근", la: "Latissimus dorsi", group: "등",
    func: "팔을 아래·뒤·안쪽으로 끌어내린다. 당기는 동작의 큰 날개.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["우르드바 다누라아사나", "Urdhva Dhanurasana"]],
    matchers: ["latissimus"],
  },
  {
    id: "gluteus", ko: "대둔근", la: "Gluteus maximus", group: "엉덩이",
    func: "고관절을 뒤로 펴고 바깥으로 돌린다. 후굴·균형의 추진력.",
    asanas: [["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"], ["비라바드라아사나 III", "Virabhadrasana III"]],
    matchers: ["gluteus maximus", "gluteus_maximus", "gluteus"],
  },
  {
    id: "quadriceps", ko: "대퇴사두근", la: "Quadriceps femoris", group: "허벅지 앞",
    func: "무릎을 곧게 펴고 고관절을 굽힌다. 서 있는 자세를 받친다.",
    asanas: [["우트카타아사나", "Utkatasana"], ["비라바드라아사나 II", "Virabhadrasana II"]],
    matchers: ["rectus femoris", "rectus_femoris", "vastus", "quadriceps"],
  },
  {
    id: "hamstrings", ko: "햄스트링", la: "Hamstrings", group: "허벅지 뒤",
    func: "무릎을 굽히고 고관절을 펴낸다. 전굴에서 가장 길게 늘어난다.",
    asanas: [["우타나아사나", "Uttanasana"], ["파스치모타나아사나", "Paschimottanasana"]],
    matchers: ["biceps femoris", "biceps_femoris", "semitendinosus", "semimembranosus", "hamstring"],
  },
  {
    id: "adductors", ko: "내전근", la: "Adductores", group: "허벅지 안쪽",
    func: "다리를 몸 중심선으로 모은다. 고관절 개방 자세에서 늘어난다.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["adductor", "gracilis", "pectineus"],
  },
  {
    id: "gastrocnemius", ko: "비복근", la: "Gastrocnemius", group: "종아리",
    func: "발목을 펴서 발끝을 밀고(저측굴곡) 무릎 굽힘을 돕는다.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["브륵샤아사나", "Vrksasana"]],
    matchers: ["gastrocnemius", "soleus"],
  },
];

// 메시 이름 → 근육 항목. 못 찾으면 null.
export function matchMuscle(rawName) {
  if (!rawName) return null;
  const n = String(rawName).toLowerCase().replace(/[._-]+/g, " ");
  for (const m of MUSCLES) {
    for (const k of m.matchers) {
      if (n.includes(k.toLowerCase())) return m;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// 근육 메타데이터 + 메시 이름 매칭
//
// Z-Anatomy / BodyParts3D에서 export한 glb의 메시 이름은 라틴/영어.
// 예: "Deltoid_muscle", "Pectoralis_major_muscle", "Biceps_brachii_muscle"
//
// matchMuscle(meshName): 클릭한 메시 이름 → 아래 항목 반환. null이면 미매핑.
// 콘솔에 찍히는 이름을 보고 해당 항목 matchers에 키워드 추가하면 됨.
// ──────────────────────────────────────────────────────────────────────────

export const MUSCLES = [
  // ── 목·어깨 ───────────────────────────────────────────────────────────
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
    id: "sternocleidomastoid", ko: "흉쇄유돌근", la: "Sternocleidomastoideus", group: "목",
    func: "머리를 반대쪽으로 돌리고, 양쪽이 함께 목을 앞으로 굽힌다.",
    asanas: [["마츠야아사나", "Matsyasana"], ["살람바 사르방가아사나", "Salamba Sarvangasana"]],
    matchers: ["sternocleidomastoid", "sternocleido", "sternomastoid"],
  },
  {
    id: "scalene", ko: "사각근", la: "Scaleni", group: "목",
    func: "목을 옆으로 굽히고 1·2번 늑골을 올려 흡기를 돕는 보조 호흡근.",
    asanas: [["마츠야아사나", "Matsyasana"], ["우자이 프라나야마", "Ujjayi Pranayama"]],
    matchers: ["scalenus", "scalene", "scaleni"],
  },

  // ── 회전근개 ──────────────────────────────────────────────────────────
  {
    id: "supraspinatus", ko: "극상근", la: "Supraspinatus", group: "회전근개",
    func: "어깨를 외전(팔을 옆으로 드는 첫 30°)시키는 회전근개의 첫 단계.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["고무카아사나", "Gomukhasana"]],
    matchers: ["supraspinatus", "supraspinous"],
  },
  {
    id: "infraspinatus", ko: "극하근", la: "Infraspinatus", group: "회전근개",
    func: "어깨를 바깥으로 돌린다(외회전). 어깨 안정성의 핵심.",
    asanas: [["고무카아사나", "Gomukhasana"], ["가루다아사나", "Garudasana"]],
    matchers: ["infraspinatus", "infraspinous"],
  },
  {
    id: "subscapularis", ko: "견갑하근", la: "Subscapularis", group: "회전근개",
    func: "어깨를 안으로 돌린다(내회전). 견갑골 앞면 전체를 덮는 심부 근육.",
    asanas: [["파스치마나마스카라아사나", "Paschima Namaskarasana"], ["가루다아사나", "Garudasana"]],
    matchers: ["subscapularis", "subscapular"],
  },
  {
    id: "teres_minor", ko: "소원근", la: "Teres minor", group: "회전근개",
    func: "어깨를 바깥으로 돌리고 내전시킨다. 극하근과 함께 외회전 담당.",
    asanas: [["고무카아사나", "Gomukhasana"], ["아도 무카 스바나아사나", "Adho Mukha Svanasana"]],
    matchers: ["teres minor", "teres_minor"],
  },

  // ── 가슴·팔 ───────────────────────────────────────────────────────────
  {
    id: "pectoralis", ko: "대흉근", la: "Pectoralis major", group: "가슴",
    func: "팔을 몸 앞·안쪽으로 모으고 안으로 돌린다. 미는 동작의 주동근.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["가루다아사나", "Garudasana"]],
    matchers: ["pectoralis major", "pectoralis_major"],
  },
  {
    id: "pectoralis_minor", ko: "소흉근", la: "Pectoralis minor", group: "가슴",
    func: "견갑골을 앞으로 당기고(전인) 내리며 호흡 시 늑골을 올린다.",
    asanas: [["가루다아사나", "Garudasana"], ["파스치마나마스카라아사나", "Paschima Namaskarasana"]],
    matchers: ["pectoralis minor", "pectoralis_minor"],
  },
  {
    id: "serratus", ko: "전거근", la: "Serratus anterior", group: "가슴 옆",
    func: "견갑골을 흉곽에 밀착시키고 앞으로 밀어낸다. 팔을 머리 위로 들 때 필수.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["바시스타아사나", "Vasisthasana"]],
    matchers: ["serratus anterior", "serratus_anterior", "serratus"],
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
    id: "brachialis", ko: "상완근", la: "Brachialis", group: "팔",
    func: "팔꿈치 굴곡의 주동근. 회전 위치에 관계없이 항상 작용.",
    asanas: [["바카아사나", "Bakasana"], ["아스타바크라아사나", "Astavakrasana"]],
    matchers: ["brachialis"],
  },
  {
    id: "forearm_flexors", ko: "전완굴곡근군", la: "Flexores carpi", group: "팔뚝",
    func: "손목을 굽히고 손가락을 쥔다. 팔을 지지하는 모든 자세에 동원.",
    asanas: [["바카아사나", "Bakasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["flexor carpi", "flexor_carpi", "flexores carpi", "palmaris longus", "palmaris_longus"],
  },

  // ── 코어 ──────────────────────────────────────────────────────────────
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
    matchers: [
      "obliquus externus", "obliquus internus", "obliquus_externus", "obliquus_internus",
      "external oblique", "internal oblique",
      "abdominal external oblique", "abdominal internal oblique",
      "abdominal_external_oblique", "abdominal_internal_oblique",
    ],
  },
  {
    id: "transversus", ko: "복횡근", la: "Transversus abdominis", group: "코어(심부)",
    func: "복부를 안쪽으로 당겨 복압을 높이는 가장 깊은 코어. 허리·골반 안정의 핵심.",
    asanas: [["우디야나 반다", "Uddiyana Bandha"], ["팔라카아사나", "Phalakasana"]],
    matchers: ["transversus abdominis", "transversus_abdominis", "transverse abdominis", "transversalis"],
  },
  {
    id: "iliopsoas", ko: "장요근", la: "Iliopsoas", group: "코어 · 고관절(심부)",
    func: "고관절을 굽히고 요추를 안정시키는 심부 코어. 다리를 들어 올린다.",
    asanas: [["비라바드라아사나 I", "Virabhadrasana I"], ["안자네야아사나", "Anjaneyasana"]],
    matchers: ["iliopsoas", "psoas major", "psoas_major", "psoas minor", "psoas_minor", "iliacus"],
  },
  {
    id: "diaphragm", ko: "횡격막", la: "Diaphragma", group: "호흡근",
    func: "주요 호흡근. 수축하면 흉강을 넓혀 공기가 들어온다. 반다 수련의 토대.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["카팔라바티", "Kapalabhati"]],
    matchers: ["diaphragm", "diaphragma"],
  },
  {
    id: "intercostals", ko: "늑간근", la: "Intercostales", group: "호흡근",
    func: "늑골 사이를 연결해 흉곽을 넓히고(외늑간) 좁힌다(내늑간). 보조 호흡근.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["삼코나아사나", "Trikonasana"]],
    matchers: ["intercostal", "intercostales", "intercostalis"],
  },

  // ── 등 ────────────────────────────────────────────────────────────────
  {
    id: "erector_spinae", ko: "척추기립근", la: "Erector spinae", group: "등(심부)",
    func: "척추를 곧게 펴고 자세를 지탱한다. 후굴의 주동근.",
    asanas: [["부장가아사나", "Bhujangasana"], ["살라바아사나", "Salabhasana"]],
    matchers: ["erector spinae", "erector_spinae", "iliocostalis", "longissimus", "spinalis"],
  },
  {
    id: "multifidus", ko: "다열근", la: "Multifidus", group: "등(심부)",
    func: "척추 분절 안정성의 핵심. 요추를 가장 깊은 층에서 지탱.",
    asanas: [["팔라카아사나", "Phalakasana"], ["살라바아사나", "Salabhasana"]],
    matchers: ["multifidus", "multifidi"],
  },
  {
    id: "latissimus", ko: "광배근", la: "Latissimus dorsi", group: "등",
    func: "팔을 아래·뒤·안쪽으로 끌어내린다. 당기는 동작의 큰 날개.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["우르드바 다누라아사나", "Urdhva Dhanurasana"]],
    matchers: ["latissimus dorsi", "latissimus_dorsi", "latissimus"],
  },
  {
    id: "rhomboids", ko: "마름근", la: "Rhomboidei", group: "등 · 어깨",
    func: "견갑골을 척추 쪽으로 끌어당기고 올린다. 등 당기기·후굴 준비에 필요.",
    asanas: [["살라바아사나", "Salabhasana"], ["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"]],
    matchers: ["rhomboid major", "rhomboid minor", "rhomboid_major", "rhomboid_minor", "rhomboids"],
  },
  {
    id: "teres_major", ko: "대원근", la: "Teres major", group: "등 · 어깨",
    func: "팔을 아래로 당기고 안으로 돌린다. 광배근의 보조근.",
    asanas: [["고무카아사나", "Gomukhasana"], ["아도 무카 스바나아사나", "Adho Mukha Svanasana"]],
    matchers: ["teres major", "teres_major"],
  },

  // ── 엉덩이·고관절 ─────────────────────────────────────────────────────
  {
    id: "gluteus_max", ko: "대둔근", la: "Gluteus maximus", group: "엉덩이",
    func: "고관절을 뒤로 펴고 바깥으로 돌린다. 후굴·균형의 추진력.",
    asanas: [["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"], ["비라바드라아사나 III", "Virabhadrasana III"]],
    matchers: ["gluteus maximus", "gluteus_maximus"],
  },
  {
    id: "gluteus_med", ko: "중둔근", la: "Gluteus medius", group: "엉덩이",
    func: "다리를 옆으로 들고(외전) 골반을 수평으로 안정시킨다. 한 발 자세의 핵심.",
    asanas: [["브륵샤아사나", "Vrksasana"], ["비라바드라아사나 III", "Virabhadrasana III"]],
    matchers: ["gluteus medius", "gluteus_medius"],
  },
  {
    id: "gluteus_min", ko: "소둔근", la: "Gluteus minimus", group: "엉덩이",
    func: "중둔근을 보조해 다리를 외전하고 골반 안정에 기여.",
    asanas: [["브륵샤아사나", "Vrksasana"], ["나타라자아사나", "Natarajasana"]],
    matchers: ["gluteus minimus", "gluteus_minimus"],
  },
  {
    id: "piriformis", ko: "이상근", la: "Piriformis", group: "고관절(심부)",
    func: "고관절을 바깥으로 돌리는 심부 외회전근. 좌골신경 근처를 지나 긴장 시 통증 유발.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["바라드바자아사나", "Bharadvajasana"]],
    matchers: ["piriformis"],
  },
  {
    id: "tensor_fasciae", ko: "대퇴근막장근", la: "Tensor fasciae latae", group: "고관절",
    func: "고관절을 굽히고 외전·내회전시킨다. 장경인대를 통해 무릎 안정에도 관여.",
    asanas: [["우타나아사나", "Uttanasana"], ["가루다아사나", "Garudasana"]],
    matchers: ["tensor fasciae latae", "tensor_fasciae_latae", "tensor fasciae", "iliotibial band", "it band"],
  },

  // ── 허벅지 ───────────────────────────────────────────────────────────
  {
    id: "quadriceps", ko: "대퇴사두근", la: "Quadriceps femoris", group: "허벅지 앞",
    func: "무릎을 곧게 펴고 고관절을 굽힌다. 서 있는 자세를 받친다.",
    asanas: [["우트카타아사나", "Utkatasana"], ["비라바드라아사나 II", "Virabhadrasana II"]],
    matchers: ["rectus femoris", "rectus_femoris", "vastus lateralis", "vastus medialis", "vastus intermedius", "vastus_lateralis", "vastus_medialis", "vastus_intermedius", "quadriceps"],
  },
  {
    id: "hamstrings", ko: "햄스트링", la: "Hamstrings", group: "허벅지 뒤",
    func: "무릎을 굽히고 고관절을 펴낸다. 전굴에서 가장 길게 늘어난다.",
    asanas: [["우타나아사나", "Uttanasana"], ["파스치모타나아사나", "Paschimottanasana"]],
    matchers: ["biceps femoris", "biceps_femoris", "semitendinosus", "semimembranosus", "hamstring"],
  },
  {
    id: "adductors", ko: "내전근군", la: "Adductores", group: "허벅지 안쪽",
    func: "다리를 몸 중심선으로 모은다. 고관절 개방 자세에서 늘어난다.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["adductor magnus", "adductor longus", "adductor brevis", "adductor_magnus", "adductor_longus", "adductor_brevis", "gracilis", "pectineus"],
  },

  // ── 종아리·발 ─────────────────────────────────────────────────────────
  {
    id: "gastrocnemius", ko: "비복근", la: "Gastrocnemius", group: "종아리",
    func: "발목을 펴서 발끝을 밀고(저측굴곡) 무릎 굽힘을 돕는다.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["브륵샤아사나", "Vrksasana"]],
    matchers: ["gastrocnemius"],
  },
  {
    id: "soleus", ko: "가자미근", la: "Soleus", group: "종아리",
    func: "발목을 아래로 펴는 저측굴곡의 주동근. 자세 유지 내구력 근육.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["타다아사나", "Tadasana"]],
    matchers: ["soleus"],
  },
  {
    id: "tibialis_anterior", ko: "전경골근", la: "Tibialis anterior", group: "정강이",
    func: "발목을 위로 들고(배측굴곡) 발 안쪽을 올린다. 보행·균형의 핵심.",
    asanas: [["우타나아사나", "Uttanasana"], ["타다아사나", "Tadasana"]],
    matchers: ["tibialis anterior", "tibialis_anterior"],
  },
];

// 메시 이름 → 근육 항목. 못 찾으면 null.
export function matchMuscle(rawName) {
  if (!rawName) return null;
  const n = String(rawName).toLowerCase().replace(/[._\-]+/g, " ");
  for (const m of MUSCLES) {
    for (const k of m.matchers) {
      if (n.includes(k.toLowerCase())) return m;
    }
  }
  return null;
}

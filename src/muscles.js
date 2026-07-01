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
    id: "platysma", ko: "광경근", la: "Platysma", group: "목",
    func: "목 앞면의 얇은 표층근. 아래턱과 입꼬리를 아래로 당기고 목 피부를 긴장시킨다.",
    asanas: [["싱하아사나", "Simhasana"], ["잘란다라 반다", "Jalandhara Bandha"]],
    matchers: ["platysma"],
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
    matchers: ["serratus anterior", "serratus_anterior"],
  },
  {
    id: "serratus_posterior", ko: "후거근", la: "Serratus posterior", group: "등(심부) · 호흡보조",
    func: "상부는 늑골을 올려 흡기를, 하부는 늑골을 내려 호기를 돕는 호흡 보조근.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["부장가아사나", "Bhujangasana"]],
    matchers: ["serratus posterior"],
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
    id: "flexor_carpi_radialis", ko: "요측수근굴근", la: "Flexor carpi radialis", group: "팔뚝(굴근)",
    func: "손목을 굽히고 노뼈(엄지)쪽으로 치우친다. 팔 지지 자세에서 동원.",
    asanas: [["바카아사나", "Bakasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["flexor carpi radialis"],
  },
  {
    id: "flexor_carpi_ulnaris", ko: "척측수근굴근", la: "Flexor carpi ulnaris", group: "팔뚝(굴근)",
    func: "손목을 굽히고 자뼈(새끼)쪽으로 치우친다.",
    asanas: [["바카아사나", "Bakasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["flexor carpi ulnaris"],
  },
  {
    id: "palmaris_longus", ko: "장장근", la: "Palmaris longus", group: "팔뚝(굴근)",
    func: "손목 굽힘을 돕고 손바닥 널힘줄을 긴장시킨다. (일부 사람은 결여)",
    asanas: [["바카아사나", "Bakasana"], ["팔라카아사나", "Phalakasana"]],
    matchers: ["palmaris longus", "palmaris_longus"],
  },
  {
    id: "flexor_digitorum_superficialis", ko: "천지굴근", la: "Flexor digitorum superficialis", group: "팔뚝(굴근)",
    func: "손가락 중간마디를 굽힌다. 무게를 손가락으로 받칠 때 작용.",
    asanas: [["바카아사나", "Bakasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["flexor digitorum superficialis"],
  },
  {
    id: "flexor_digitorum_profundus", ko: "심지굴근", la: "Flexor digitorum profundus", group: "팔뚝(굴근)",
    func: "손가락 끝마디를 굽혀 강하게 쥔다.",
    asanas: [["바카아사나", "Bakasana"], ["아도 무카 브륵샤아사나", "Adho Mukha Vrksasana"]],
    matchers: ["flexor digitorum profundus"],
  },
  {
    id: "pronator_teres", ko: "원회내근", la: "Pronator teres", group: "팔뚝(굴근)",
    func: "아래팔을 안으로 돌린다(회내). 팔꿈치 굽힘도 돕는다.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["바카아사나", "Bakasana"]],
    matchers: ["pronator teres"],
  },
  {
    id: "pronator_quadratus", ko: "방형회내근", la: "Pronator quadratus", group: "팔뚝(굴근)",
    func: "손목 근처에서 아래팔을 안으로 돌린다(회내)의 주동근.",
    asanas: [["차투랑가 단다아사나", "Chaturanga Dandasana"], ["팔라카아사나", "Phalakasana"]],
    matchers: ["pronator quadratus"],
  },

  // ── 코어 ──────────────────────────────────────────────────────────────
  {
    id: "rectus_abdominis", ko: "복직근", la: "Rectus abdominis", group: "코어",
    func: "척추를 앞으로 굽히고 골반과 흉곽을 끌어당긴다. 코어 안정의 표층.",
    asanas: [["나바아사나", "Navasana"], ["팔라카아사나", "Phalakasana"]],
    matchers: ["rectus abdominis", "rectus_abdominis"],
  },
  {
    id: "external_oblique", ko: "외복사근", la: "Obliquus externus abdominis", group: "코어",
    func: "복부 측면의 표층. 몸통을 반대쪽으로 비틀고 같은 쪽으로 옆굽힘. 복압을 만든다.",
    asanas: [["파리브르타 트리코나아사나", "Parivrtta Trikonasana"], ["바시스타아사나", "Vasisthasana"]],
    matchers: [
      "external abdominal oblique", "obliquus externus abdominis", "abdominal external oblique",
    ],
  },
  {
    id: "internal_oblique", ko: "내복사근", la: "Obliquus internus abdominis", group: "코어(심부)",
    func: "외복사근 아래층. 몸통을 같은 쪽으로 비틀고 옆굽힘. 복압으로 허리를 보호한다.",
    asanas: [["파리브르타 파르스바코나아사나", "Parivrtta Parsvakonasana"], ["바시스타아사나", "Vasisthasana"]],
    matchers: [
      "internal abdominal oblique", "obliquus internus abdominis", "abdominal internal oblique",
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
    id: "iliocostalis", ko: "장늑근", la: "Iliocostalis", group: "등(심부) · 척추기립근",
    func: "척추기립근의 가장 바깥 기둥. 척추를 펴고 같은 쪽으로 옆굽힘. 후굴을 돕는다.",
    asanas: [["부장가아사나", "Bhujangasana"], ["살라바아사나", "Salabhasana"]],
    matchers: ["iliocostalis"],
  },
  {
    id: "longissimus", ko: "최장근", la: "Longissimus", group: "등(심부) · 척추기립근",
    func: "척추기립근의 가운데 기둥이자 가장 길다. 척추와 머리를 펴고 자세를 지탱.",
    asanas: [["부장가아사나", "Bhujangasana"], ["우스트라아사나", "Ustrasana"]],
    matchers: ["longissimus", "erector spinae", "erector_spinae"],
  },
  {
    // semispinalis 는 spinalis(극근)보다 앞에 둬야 "spinalis" 매처에 안 걸림
    id: "semispinalis", ko: "반극근", la: "Semispinalis", group: "등(심부) · 횡돌기극근",
    func: "머리·목·등을 펴고 반대쪽으로 회전. 목 후굴의 심부 안정근.",
    asanas: [["마츠야아사나", "Matsyasana"], ["우스트라아사나", "Ustrasana"]],
    matchers: ["semispinalis"],
  },
  {
    id: "spinalis", ko: "극근", la: "Spinalis", group: "등(심부) · 척추기립근",
    func: "척추기립근의 가장 안쪽 기둥. 척추를 곧게 펴 자세를 세운다.",
    asanas: [["부장가아사나", "Bhujangasana"], ["살라바아사나", "Salabhasana"]],
    matchers: ["spinalis"],
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
    id: "rhomboid_major", ko: "대능형근", la: "Rhomboid major", group: "등 · 어깨",
    func: "견갑골을 척추 쪽으로 모으고 아래로 회전. 등 당기기·후굴 준비에 필요.",
    asanas: [["살라바아사나", "Salabhasana"], ["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"]],
    matchers: ["rhomboid major", "rhomboid_major"],
  },
  {
    id: "rhomboid_minor", ko: "소능형근", la: "Rhomboid minor", group: "등 · 어깨",
    func: "대능형근 위쪽에서 견갑골을 척추 쪽으로 모은다.",
    asanas: [["살라바아사나", "Salabhasana"], ["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"]],
    matchers: ["rhomboid minor", "rhomboid_minor"],
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
    matchers: ["tensor fasciae latae", "tensor_fasciae_latae", "tensor fasciae", "iliotibial", "it band"],
  },

  // ── 허벅지 ───────────────────────────────────────────────────────────
  {
    id: "rectus_femoris", ko: "대퇴직근", la: "Rectus femoris", group: "허벅지 앞 · 대퇴사두근",
    func: "대퇴사두근 중 유일하게 고관절을 지나 무릎 폄+고관절 굽힘. 서기·차기의 핵심.",
    asanas: [["우트카타아사나", "Utkatasana"], ["비라바드라아사나 I", "Virabhadrasana I"]],
    matchers: ["rectus femoris", "rectus_femoris"],
  },
  {
    id: "vastus_lateralis", ko: "외측광근", la: "Vastus lateralis", group: "허벅지 앞 · 대퇴사두근",
    func: "대퇴사두근의 바깥 갈래. 무릎을 곧게 편다.",
    asanas: [["우트카타아사나", "Utkatasana"], ["비라바드라아사나 II", "Virabhadrasana II"]],
    matchers: ["vastus lateralis", "vastus_lateralis"],
  },
  {
    id: "vastus_medialis", ko: "내측광근", la: "Vastus medialis", group: "허벅지 앞 · 대퇴사두근",
    func: "대퇴사두근의 안쪽 갈래. 무릎 폄 마지막 각도와 슬개골 안정에 관여.",
    asanas: [["우트카타아사나", "Utkatasana"], ["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"]],
    matchers: ["vastus medialis", "vastus_medialis"],
  },
  {
    id: "vastus_intermedius", ko: "중간광근", la: "Vastus intermedius", group: "허벅지 앞 · 대퇴사두근",
    func: "대퇴직근 아래 깊은 갈래. 무릎을 편다.",
    asanas: [["우트카타아사나", "Utkatasana"], ["단다아사나", "Dandasana"]],
    matchers: ["vastus intermedius", "vastus_intermedius"],
  },
  {
    id: "biceps_femoris", ko: "대퇴이두근", la: "Biceps femoris", group: "허벅지 뒤 · 햄스트링",
    func: "햄스트링의 바깥 근육(장두·단두). 무릎 굽힘+고관절 폄, 정강이 바깥돌림.",
    asanas: [["우타나아사나", "Uttanasana"], ["파스치모타나아사나", "Paschimottanasana"]],
    matchers: ["biceps femoris", "biceps_femoris"],
  },
  {
    id: "semitendinosus", ko: "반건양근", la: "Semitendinosus", group: "허벅지 뒤 · 햄스트링",
    func: "햄스트링 안쪽. 무릎 굽힘+고관절 폄. 무릎 안쪽 거위발건(pes anserinus)을 이루는 세 근육 중 하나.",
    asanas: [["우타나아사나", "Uttanasana"], ["파스치모타나아사나", "Paschimottanasana"]],
    matchers: ["semitendinosus"],
  },
  {
    id: "semimembranosus", ko: "반막양근", la: "Semimembranosus", group: "허벅지 뒤 · 햄스트링",
    func: "햄스트링 안쪽 심부. 무릎 굽힘+고관절 폄, 정강이 안쪽돌림.",
    asanas: [["우타나아사나", "Uttanasana"], ["파스치모타나아사나", "Paschimottanasana"]],
    matchers: ["semimembranosus"],
  },
  {
    id: "adductor_magnus", ko: "대내전근", la: "Adductor magnus", group: "허벅지 안쪽 · 내전근",
    func: "가장 큰 내전근. 다리를 모으고 고관절을 편다(후방섬유). 받다코나 계열에서 늘어남.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["adductor magnus", "adductor_magnus", "adductor minimus"],
  },
  {
    id: "adductor_longus", ko: "장내전근", la: "Adductor longus", group: "허벅지 안쪽 · 내전근",
    func: "내전근 앞쪽. 다리를 모으고 고관절 굽힘을 돕는다.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["adductor longus", "adductor_longus"],
  },
  {
    id: "adductor_brevis", ko: "단내전근", la: "Adductor brevis", group: "허벅지 안쪽 · 내전근",
    func: "장내전근 아래 짧은 내전근. 다리를 모은다.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["adductor brevis", "adductor_brevis"],
  },
  {
    id: "gracilis", ko: "박근", la: "Gracilis", group: "허벅지 안쪽 · 내전근",
    func: "내전근 중 가장 얇고 길다. 다리 모음+무릎 굽힘. 무릎 안쪽 거위발건(pes anserinus)을 이루는 세 근육 중 하나.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["우파비스타 코나아사나", "Upavistha Konasana"]],
    matchers: ["gracilis"],
  },
  {
    id: "pectineus", ko: "치골근", la: "Pectineus", group: "허벅지 안쪽 · 내전근",
    func: "치골에서 시작하는 짧은 내전·굴곡근. 고관절을 모으고 굽힌다.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["안자네야아사나", "Anjaneyasana"]],
    matchers: ["pectineus"],
  },
  {
    id: "sartorius", ko: "봉공근", la: "Sartorius", group: "허벅지 앞 · 골반",
    func: "몸에서 가장 긴 근육. 고관절 굽힘·외전·외회전 + 무릎 굽힘(책상다리 자세 근육). 무릎 안쪽 거위발건(pes anserinus)을 이루는 세 근육 중 하나.",
    asanas: [["받다 코나아사나", "Baddha Konasana"], ["비라바드라아사나 II", "Virabhadrasana II"]],
    matchers: ["sartorius"],
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
  {
    id: "tibialis_posterior", ko: "후경골근", la: "Tibialis posterior", group: "종아리(심부)",
    func: "발끝을 밀고 발 안쪽 아치를 들어 올린다(내번). 발아치 지지의 핵심.",
    asanas: [["타다아사나", "Tadasana"], ["브륵샤아사나", "Vrksasana"]],
    matchers: ["tibialis posterior"],
  },
  {
    id: "fibularis_longus", ko: "긴종아리근", la: "Fibularis longus", group: "종아리 바깥",
    func: "발을 바깥으로 젖히고(외번) 저측굴곡. 발목 가쪽 안정과 아치 지지.",
    asanas: [["타다아사나", "Tadasana"], ["비라바드라아사나 II", "Virabhadrasana II"]],
    matchers: ["fibularis longus", "peroneus longus"],
  },
  {
    id: "fibularis_brevis", ko: "짧은종아리근", la: "Fibularis brevis", group: "종아리 바깥",
    func: "발을 바깥으로 젖힌다(외번). 발목 가쪽 안정.",
    asanas: [["타다아사나", "Tadasana"], ["우티타 트리코나아사나", "Utthita Trikonasana"]],
    matchers: ["fibularis brevis", "peroneus brevis"],
  },
  {
    id: "fibularis_tertius", ko: "셋째종아리근", la: "Fibularis tertius", group: "종아리 바깥",
    func: "발목을 위로 들고(배측굴곡) 바깥으로 젖힌다.",
    asanas: [["타다아사나", "Tadasana"], ["우타나아사나", "Uttanasana"]],
    matchers: ["fibularis tertius", "peroneus tertius"],
  },
  {
    id: "popliteus", ko: "오금근", la: "Popliteus", group: "무릎 뒤(심부)",
    func: "정강이를 안으로 돌려 무릎을 '풀어' 굽힘을 시작한다. 무릎 안정근.",
    asanas: [["말라아사나", "Malasana"], ["비라아사나", "Virasana"]],
    matchers: ["popliteus"],
  },
  {
    id: "plantaris", ko: "장딴지빗근", la: "Plantaris", group: "종아리",
    func: "비복근을 보조해 발목 저측굴곡·무릎 굽힘을 돕는 가느다란 근육.",
    asanas: [["아도 무카 스바나아사나", "Adho Mukha Svanasana"], ["타다아사나", "Tadasana"]],
    matchers: ["plantaris"],
  },

  // ── 코어·허리(심부) ──────────────────────────────────────────────────
  {
    id: "quadratus_lumborum", ko: "요방형근", la: "Quadratus lumborum", group: "허리(심부)",
    func: "골반과 12번 늑골·요추를 잇는 심부근. 몸통 옆굽힘과 허리 안정의 핵심.",
    asanas: [["우티타 트리코나아사나", "Utthita Trikonasana"], ["파리가아사나", "Parighasana"]],
    matchers: ["quadratus lumborum"],
  },
  {
    id: "pyramidalis", ko: "추체근", la: "Pyramidalis", group: "코어",
    func: "복직근 아래 삼각형 작은 근육. 백선(linea alba)을 긴장시킨다.",
    asanas: [["나바아사나", "Navasana"], ["우디야나 반다", "Uddiyana Bandha"]],
    matchers: ["pyramidalis"],
  },

  // ── 골반저근 (물라 반다) ──────────────────────────────────────────────
  {
    id: "pubococcygeus", ko: "치골미골근", la: "Pubococcygeus", group: "골반저근",
    func: "골반저(항문거근)의 앞부분. 골반 장기를 받치고 복압·물라 반다에 관여.",
    asanas: [["물라 반다", "Mula Bandha"], ["우디야나 반다", "Uddiyana Bandha"]],
    matchers: ["pubococcygeus", "pubo analis", "pubo-analis"],
  },
  {
    id: "iliococcygeus", ko: "장골미골근", la: "Iliococcygeus", group: "골반저근",
    func: "골반저(항문거근)의 뒷부분. 골반저를 위로 끌어올려 받친다.",
    asanas: [["물라 반다", "Mula Bandha"], ["아쉬위니 무드라", "Ashwini Mudra"]],
    matchers: ["iliococcygeus"],
  },
  {
    id: "coccygeus", ko: "미골근", la: "Coccygeus", group: "골반저근",
    func: "꼬리뼈를 앞으로 당기고 골반저 뒤쪽을 지지한다.",
    asanas: [["물라 반다", "Mula Bandha"], ["세투 반다 사르방가아사나", "Setu Bandha Sarvangasana"]],
    matchers: ["coccygeus"],
  },

  // ── 심부 고관절 외회전근 (이상근과 한 팀) ──────────────────────────────
  {
    id: "superior_gemellus", ko: "위쌍둥이근", la: "Superior gemellus", group: "고관절(심부)",
    func: "내폐쇄근과 함께 고관절을 바깥으로 돌린다. 심부 외회전 6근 중 하나.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["고무카아사나", "Gomukhasana"]],
    matchers: ["superior gemellus"],
  },
  {
    id: "inferior_gemellus", ko: "아래쌍둥이근", la: "Inferior gemellus", group: "고관절(심부)",
    func: "내폐쇄근과 함께 고관절을 바깥으로 돌린다. 심부 외회전 6근 중 하나.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["고무카아사나", "Gomukhasana"]],
    matchers: ["inferior gemellus"],
  },
  {
    id: "quadratus_femoris", ko: "대퇴방형근", la: "Quadratus femoris", group: "고관절(심부)",
    func: "고관절을 강하게 바깥으로 돌린다. 심부 외회전 6근 중 하나.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["바라드바자아사나", "Bharadvajasana"]],
    matchers: ["quadratus femoris"],
  },
  {
    id: "obturator_internus", ko: "내폐쇄근", la: "Obturator internus", group: "고관절(심부)",
    func: "골반 안쪽에서 나와 고관절을 바깥으로 돌린다. 심부 외회전 6근 중 하나.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["받다 코나아사나", "Baddha Konasana"]],
    matchers: ["obturator internus"],
  },
  {
    id: "obturator_externus", ko: "외폐쇄근", la: "Obturator externus", group: "고관절(심부)",
    func: "고관절을 바깥으로 돌리고 모은다. 심부 외회전근.",
    asanas: [["에카 파다 라자카포타아사나", "Eka Pada Rajakapotasana"], ["받다 코나아사나", "Baddha Konasana"]],
    matchers: ["obturator externus"],
  },

  // ── 목(심부·표층) ────────────────────────────────────────────────────
  {
    id: "levator_scapulae", ko: "견갑거근", la: "Levator scapulae", group: "목 · 어깨",
    func: "견갑골을 끌어올리고 목을 옆으로 굽힌다. 어깨 결림·자세 불량과 밀접.",
    asanas: [["발라아사나", "Balasana"], ["숩타 밧다 코나아사나", "Supta Baddha Konasana"]],
    matchers: ["levator scapulae"],
  },
  {
    id: "splenius_capitis", ko: "머리널판근", la: "Splenius capitis", group: "목(심부)",
    func: "머리를 뒤로 젖히고 같은 쪽으로 돌린다. 목 후굴의 주동근.",
    asanas: [["우스트라아사나", "Ustrasana"], ["마츠야아사나", "Matsyasana"]],
    matchers: ["splenius capitis"],
  },
  {
    id: "splenius_cervicis", ko: "목널판근", la: "Splenius cervicis", group: "목(심부)",
    func: "목을 뒤로 젖히고 같은 쪽으로 돌린다.",
    asanas: [["우스트라아사나", "Ustrasana"], ["부장가아사나", "Bhujangasana"]],
    matchers: ["splenius colli", "splenius cervicis"],
  },
  {
    id: "longus_colli", ko: "목긴근", la: "Longus colli", group: "목(심부)",
    func: "목뼈 앞쪽 심부 굴근. 목을 앞으로 굽히고 안정시킨다. 잘란다라 반다와 관련.",
    asanas: [["잘란다라 반다", "Jalandhara Bandha"], ["살람바 사르방가아사나", "Salamba Sarvangasana"]],
    matchers: ["longus colli", "longus cervicis"],
  },
  {
    id: "longus_capitis", ko: "머리긴근", la: "Longus capitis", group: "목(심부)",
    func: "머리를 앞으로 굽히는 심부 굴근. 잘란다라 반다에서 목 앞 조절.",
    asanas: [["잘란다라 반다", "Jalandhara Bandha"], ["살람바 사르방가아사나", "Salamba Sarvangasana"]],
    matchers: ["longus capitis"],
  },

  // ── 팔뚝(추가) ───────────────────────────────────────────────────────
  {
    id: "brachioradialis", ko: "상완요골근", la: "Brachioradialis", group: "팔뚝",
    func: "팔꿈치를 굽힌다(중립 회전에서 강함). 팔 균형 자세에서 동원.",
    asanas: [["바카아사나", "Bakasana"], ["아스타바크라아사나", "Astavakrasana"]],
    matchers: ["brachioradialis"],
  },
  {
    id: "supinator", ko: "회외근", la: "Supinator", group: "팔뚝",
    func: "아래팔을 바깥으로 돌린다(회외, 손바닥을 위로).",
    asanas: [["고무카아사나", "Gomukhasana"], ["바카아사나", "Bakasana"]],
    matchers: ["supinator"],
  },

  // ── 후두근 (성문 조절 · 우자이/잘란다라 반다) ─────────────────────────
  {
    id: "cricothyroid", ko: "윤상갑상근", la: "Cricothyroid", group: "후두",
    func: "성대를 늘여 팽팽하게(음 높임) 한다. 우자이 호흡의 성문 소리와 관련.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["옴 찬팅", "Om Chanting"]],
    matchers: ["cricothyroid"],
  },
  {
    id: "posterior_cricoarytenoid", ko: "뒤반지피열근", la: "Posterior cricoarytenoid", group: "후두",
    func: "성대문을 여는 유일한 근육(외전). 흡기 때 기도를 연다.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["카팔라바티", "Kapalabhati"]],
    matchers: ["posterior crico arytenoid", "posterior cricoarytenoid"],
  },
  {
    id: "lateral_cricoarytenoid", ko: "가쪽반지피열근", la: "Lateral cricoarytenoid", group: "후두",
    func: "성대문을 닫는다(내전). 우자이 호흡의 성문 좁힘에 관여.",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["잘란다라 반다", "Jalandhara Bandha"]],
    matchers: ["lateral crico arytenoid", "lateral cricoarytenoid"],
  },
  {
    // aryepiglottic 은 'oblique arytenoid'를 포함하므로 피열근보다 앞에 둠
    id: "aryepiglottic", ko: "피열후두개근", la: "Aryepiglotticus", group: "후두",
    func: "삼킴·발성 시 후두 입구를 좁힌다.",
    asanas: [["잘란다라 반다", "Jalandhara Bandha"], ["우자이 프라나야마", "Ujjayi Pranayama"]],
    matchers: ["ary epiglottic", "aryepiglottic"],
  },
  {
    id: "arytenoid", ko: "피열근", la: "Arytenoideus", group: "후두",
    func: "좌우 피열연골을 모아 성대문 뒤쪽을 닫는다(횡·사피열근).",
    asanas: [["우자이 프라나야마", "Ujjayi Pranayama"], ["잘란다라 반다", "Jalandhara Bandha"]],
    matchers: ["transverse arytenoid", "oblique arytenoid"],
  },
  {
    id: "thyroarytenoid", ko: "갑상피열근", la: "Thyroarytenoid", group: "후두",
    func: "성대를 짧고 두껍게 해 이완시킨다(성대근 포함). 낮은 발성·이완 호흡과 관련.",
    asanas: [["옴 찬팅", "Om Chanting"], ["브라마리 프라나야마", "Bhramari Pranayama"]],
    matchers: ["thyro arytenoid", "thyroarytenoid", "vocalis"],
  },
];

// 호흡근 모드에서 isolate 할 근육 (1차 호흡근 + 보조 흡기근 + 강제 호기 복부근)
export const BREATHING_IDS = [
  "diaphragm",            // 횡격막 (주 호흡근)
  "intercostals",         // 늑간근
  "scalene",              // 사각근 (보조 흡기)
  "sternocleidomastoid",  // 흉쇄유돌근 (보조 흡기)
  "transversus",          // 복횡근 (강제 호기)
  "external_oblique",     // 외복사근 (강제 호기)
  "internal_oblique",     // 내복사근 (강제 호기)
  "rectus_abdominis",     // 복직근 (강제 호기)
];

// 아사나(산스크리트명) → 그 아사나에 동원되는 근육 목록 (역방향 매핑)
export function musclesForAsana(sanskrit) {
  return MUSCLES.filter((m) => m.asanas.some(([, sa]) => sa === sanskrit));
}

// 근막·널힘줄·인대 등 결합조직 메시 판별 (근육을 덮어 가리고, 클릭 시 잘못 잡힘)
// → 근육 레이어에서 기본으로 숨겨 실제 근육이 보이고 클릭되게 함.
// 단, 이름에 "muscle"이 있으면 진짜 근육이므로 보존 (예: Tensor fasciae latae muscle).
const CONNECTIVE_KW = [
  "fascia", "aponeuros", "retinaculum", "ligament", "septum",
  "sheath", "membrane", "raphe", "areolar", "bursa", "tendon",
];
export function isConnectiveTissue(rawName) {
  if (!rawName) return false;
  const n = String(rawName).toLowerCase();
  if (n.includes("muscle")) return false;
  return CONNECTIVE_KW.some((k) => n.includes(k));
}

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

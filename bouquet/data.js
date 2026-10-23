/* =====================================================================
   Fl.own — 데이터 파일
   ---------------------------------------------------------------------
   이 파일 하나만 고치면 꽃, 꽃말, 색, 포장지, 리본, 마음, 추천 조합이
   모두 바뀝니다. 코드는 건드리지 않아도 돼요.

   고칠 때 지킬 것 세 가지
   1. 글자는 반드시 따옴표 '...' 안에 쓰기
   2. 항목과 항목 사이에는 쉼표(,) 찍기
   3. id(영문 이름)는 그림 파일 이름과 연결되니, 바꾸면 그림 파일 이름도 같이 바꾸기

   꽃말은 꽃집·도감마다 조금씩 다르게 전해집니다. 출처가 여러 갈래인 것은
   옆에 "확인 필요"라고 적어 두었어요. 공모전 제출 전에 한 번 확인해 주세요.
   ===================================================================== */

window.HANSONGI = {

  /* 서비스 이름 — 여기만 바꾸면 사이트 전체 이름이 바뀝니다 */
  serviceName: 'Fl.own',
  tagline: '한 송이씩 골라 엮는 나만의 꽃다발',

  /* 꽃 그림 파일 설정
     images/flowers 폴더에 '꽃id-색id.png' 파일을 넣으면 코드 그림 대신 그 그림이 나옵니다.
     예) rose-red.png, eucalyptus-sage.png
     파일이 없으면 자동으로 코드로 그린 꽃이 나오니 걱정하지 않아도 돼요. */
  images: {
    flowers: 'images/flowers/',
    real: 'images/real/',
    ext: '.png'
  },

  /* ---------------------------------------------------------------
     색 팔레트
     꽃의 '색'은 여기 있는 색 중에서 고릅니다. hex는 화면에 칠해지는 색이에요.
     tones : 추천 받기에서 '전체 색감'을 고를 때 쓰는 분류
             warm 따뜻한 색 / cool 시원한 색 / pastel 파스텔 / white 화이트&그린 / vivid 선명한 색
     --------------------------------------------------------------- */
  colors: {
    red:       { name: '레드',       hex: '#B4243A', tones: ['warm', 'vivid'] },
    burgundy:  { name: '버건디',     hex: '#6E1B2C', tones: ['warm'] },
    pink:      { name: '핑크',       hex: '#EC8FA8', tones: ['warm', 'pastel'] },
    blush:     { name: '연핑크',     hex: '#F3CBC6', tones: ['pastel', 'warm'] },
    coral:     { name: '코랄',       hex: '#EF8466', tones: ['warm', 'vivid'] },
    orange:    { name: '오렌지',     hex: '#F0943A', tones: ['warm', 'vivid'] },
    peach:     { name: '피치',       hex: '#F5BE98', tones: ['warm', 'pastel'] },
    yellow:    { name: '옐로',       hex: '#F4CC45', tones: ['warm', 'vivid'] },
    cream:     { name: '크림',       hex: '#F1E5C8', tones: ['white', 'pastel'] },
    white:     { name: '화이트',     hex: '#FAF7F0', tones: ['white'] },
    lavender:  { name: '라벤더',     hex: '#C6B3E2', tones: ['cool', 'pastel'] },
    purple:    { name: '퍼플',       hex: '#7D58A4', tones: ['cool', 'vivid'] },
    blue:      { name: '블루',       hex: '#5F84CC', tones: ['cool', 'vivid'] },
    skyblue:   { name: '스카이블루', hex: '#A6C4E8', tones: ['cool', 'pastel'] },
    green:     { name: '그린',       hex: '#B8CF8A', tones: ['white'] },
    sage:      { name: '세이지',     hex: '#8FA88C', tones: ['white'] },
    leaf:      { name: '초록',       hex: '#4C7748', tones: ['white'] },
    deepgreen: { name: '진초록',     hex: '#355F38', tones: ['white'] },
    mistblue:  { name: '미스티블루', hex: '#9A97D4', tones: ['cool', 'pastel'] }
  },

  /* ---------------------------------------------------------------
     꽃 목록
     id      : 영문 이름 (그림 파일 이름에 쓰임)
     name    : 화면에 보이는 이름
     group   : 'main' 메인 꽃 / 'filler' 채움 꽃 / 'leaf' 잎 소재
     meaning : 대표 꽃말
     colors  : 고를 수 있는 색. 색마다 꽃말이 다르면 meaning을 따로 적어요.
               meaning을 안 적으면 대표 꽃말이 쓰입니다.
     shape   : 코드로 그릴 때의 모양 (그림 파일을 넣으면 쓰이지 않아요)
     art     : 그림 비율. 'head' 정사각형 꽃 머리 / 'tall' 세로로 긴 꽃 / 'sprig' 잎 가지
     size    : 꽃다발 안에서의 크기 (1이 보통, 1.4면 40% 크게)
     vibes   : 추천 받기에서 쓰는 분위기. bright 화사한 / calm 차분한 / elegant 우아한 / cute 사랑스러운 / natural 자연스러운
     moods   : 꽃말과 어울리는 마음 (아래 '전하고 싶은 마음'의 id). 색마다 다르면 색 옆에 moods를 따로 적어요.
     --------------------------------------------------------------- */
  flowers: [
    /* ── 메인 꽃 ─────────────────────────────── */
    { id: 'rose', name: '장미', group: 'main', meaning: '사랑', shape: 'rose', art: 'head', size: 1,
      vibes: ['elegant', 'bright'], moods: ['love', 'thanks'],
      colors: [
        { id: 'red',      meaning: '열렬한 사랑', moods: ['love'] },
        { id: 'pink',     meaning: '감사, 행복한 사랑' },
        { id: 'white',    meaning: '존경, 순결', moods: ['thanks'] },
        { id: 'yellow',   meaning: '우정, 완벽한 성취', moods: ['celebrate', 'cheer'] },
        { id: 'orange',   meaning: '첫사랑, 수줍음', moods: ['love'] },
        { id: 'lavender', meaning: '영원한 사랑', moods: ['love'] }
      ] },

    { id: 'spray-rose', name: '스프레이 장미', group: 'main', meaning: '사랑스러움', shape: 'sprayrose', art: 'head', size: 0.95,
      vibes: ['cute', 'natural'], moods: ['love', 'thanks'],
      // 스프레이 장미는 따로 정해진 꽃말보다 장미의 색별 꽃말을 함께 쓰는 경우가 많아요
      colors: [
        { id: 'pink',  meaning: '감사, 행복한 사랑' },
        { id: 'blush', meaning: '사랑의 맹세' },        // 확인 필요
        { id: 'white', meaning: '존경, 순결' },
        { id: 'peach', meaning: '수줍은 사랑' }          // 확인 필요
      ] },

    { id: 'tulip', name: '튤립', group: 'main', meaning: '사랑의 고백', shape: 'tulip', art: 'head', size: 0.9,
      vibes: ['cute', 'bright'], moods: ['love'],
      colors: [
        { id: 'red',    meaning: '사랑의 고백' },
        { id: 'pink',   meaning: '애정, 배려', moods: ['love', 'thanks', 'sorry'] },
        { id: 'white',  meaning: '용서, 새로운 시작', moods: ['sorry', 'cheer'] },
        { id: 'yellow', meaning: '헛된 사랑', moods: [] },
        { id: 'purple', meaning: '영원한 사랑' }
      ] },

    { id: 'peony', name: '작약', group: 'main', meaning: '수줍음, 행복한 결혼', shape: 'peony', art: 'head', size: 1.25,
      vibes: ['elegant', 'bright'], moods: ['celebrate', 'love'],
      colors: [ { id: 'blush' }, { id: 'pink' }, { id: 'white' }, { id: 'coral' } ] },

    { id: 'ranunculus', name: '라넌큘러스', group: 'main', meaning: '매력, 매혹', shape: 'ranunculus', art: 'head', size: 0.95,
      vibes: ['cute', 'elegant'], moods: ['love', 'celebrate'],
      colors: [ { id: 'peach' }, { id: 'pink' }, { id: 'white' }, { id: 'yellow' }, { id: 'red' }, { id: 'orange' } ] },

    { id: 'gerbera', name: '거베라', group: 'main', meaning: '희망, 신비', shape: 'gerbera', art: 'head', size: 1.05,
      vibes: ['bright', 'cute'], moods: ['cheer', 'celebrate'],
      colors: [ { id: 'orange' }, { id: 'pink' }, { id: 'yellow' }, { id: 'red' }, { id: 'white' } ] },

    { id: 'carnation', name: '카네이션', group: 'main', meaning: '사랑, 존경', shape: 'carnation', art: 'head', size: 0.9,
      vibes: ['calm', 'cute'], moods: ['thanks'],
      colors: [
        { id: 'red',   meaning: '어버이에 대한 사랑, 존경' },
        { id: 'pink',  meaning: '감사, 아름다운 사랑' },
        { id: 'white', meaning: '순수한 사랑' },
        { id: 'green' }
      ] },

    { id: 'lisianthus', name: '리시안셔스', group: 'main', meaning: '변치 않는 사랑', shape: 'lisianthus', art: 'head', size: 0.95,
      vibes: ['elegant', 'calm'], moods: ['love', 'thanks'],
      colors: [ { id: 'white' }, { id: 'lavender' }, { id: 'blush' }, { id: 'purple' }, { id: 'green' } ] },

    { id: 'hydrangea', name: '수국', group: 'main', meaning: '진심', shape: 'hydrangea', art: 'head', size: 1.45,
      vibes: ['calm', 'natural'], moods: ['comfort', 'thanks'],
      colors: [ { id: 'skyblue' }, { id: 'blue' }, { id: 'pink' }, { id: 'white' }, { id: 'lavender' }, { id: 'green' } ] },

    { id: 'sunflower', name: '해바라기', group: 'main', meaning: '동경, 일편단심', shape: 'sunflower', art: 'head', size: 1.2,
      vibes: ['bright', 'natural'], moods: ['cheer', 'celebrate'],
      colors: [ { id: 'yellow' } ] },

    { id: 'freesia', name: '프리지아', group: 'main', meaning: '새로운 시작, 천진난만', shape: 'freesia', art: 'head', size: 0.9,
      vibes: ['bright', 'natural'], moods: ['cheer', 'celebrate'],
      colors: [ { id: 'yellow' }, { id: 'white' }, { id: 'lavender' } ] },

    { id: 'lily', name: '백합', group: 'main', meaning: '순결, 변함없는 사랑', shape: 'lily', art: 'head', size: 1.2,
      vibes: ['elegant'], moods: ['love', 'celebrate'],
      colors: [ { id: 'white' }, { id: 'pink' }, { id: 'yellow' } ] },

    { id: 'chrysanthemum', name: '소국', group: 'main', meaning: '밝은 마음', shape: 'daisy', art: 'head', size: 0.72,
      vibes: ['natural', 'cute'], moods: ['cheer', 'comfort'],
      colors: [ { id: 'white' }, { id: 'yellow' }, { id: 'green' }, { id: 'pink' } ] },

    { id: 'alstroemeria', name: '알스트로메리아', group: 'main', meaning: '배려, 새로운 만남', shape: 'alstroemeria', art: 'head', size: 1,
      vibes: ['bright', 'natural'], moods: ['thanks', 'cheer', 'sorry'],
      colors: [ { id: 'pink' }, { id: 'peach' }, { id: 'white' }, { id: 'yellow' }, { id: 'lavender' } ] },

    { id: 'anemone', name: '아네모네', group: 'main', meaning: '기대, 진실', shape: 'anemone', art: 'head', size: 0.95,
      vibes: ['elegant'], moods: ['love'],
      colors: [
        { id: 'red',    meaning: '그대를 사랑해' },
        { id: 'white',  meaning: '기대, 진실', moods: ['cheer'] },
        { id: 'purple', meaning: '당신을 믿고 기다리다', moods: ['comfort', 'love'] },
        { id: 'pink',   meaning: '희망', moods: ['cheer'] }                // 확인 필요
      ] },

    { id: 'delphinium', name: '델피니움', group: 'main', meaning: '당신을 행복하게 해 줄게요', shape: 'delphinium', art: 'tall', size: 1,
      vibes: ['calm', 'natural'], moods: ['cheer', 'love'],
      colors: [ { id: 'blue' }, { id: 'skyblue' }, { id: 'white' }, { id: 'purple' } ] },

    { id: 'sweet-pea', name: '스위트피', group: 'main', meaning: '행복한 추억, 기쁜 이별', shape: 'sweetpea', art: 'head', size: 0.85,
      vibes: ['cute', 'natural'], moods: ['comfort', 'thanks'],
      colors: [ { id: 'pink' }, { id: 'lavender' }, { id: 'white' }, { id: 'coral' } ] },

    { id: 'calla', name: '칼라', group: 'main', meaning: '순수, 천년의 사랑', shape: 'calla', art: 'tall', size: 1,
      vibes: ['elegant'], moods: ['celebrate', 'love'],
      colors: [ { id: 'white' }, { id: 'yellow' }, { id: 'burgundy' }, { id: 'pink' } ] },

    { id: 'stock', name: '스토크', group: 'main', meaning: '영원한 아름다움', shape: 'stock', art: 'tall', size: 1,
      vibes: ['elegant', 'calm'], moods: ['celebrate', 'thanks'],
      colors: [ { id: 'white' }, { id: 'pink' }, { id: 'lavender' }, { id: 'purple' } ] },

    /* ── 채움 꽃 ─────────────────────────────── */
    { id: 'gypsophila', name: '안개꽃', group: 'filler', meaning: '맑은 마음', shape: 'gypsophila', art: 'head', size: 1.05,
      vibes: ['cute', 'elegant', 'calm'], moods: ['love', 'celebrate', 'comfort'],
      colors: [ { id: 'white' }, { id: 'pink' } ] },

    { id: 'statice', name: '스타티스', group: 'filler', meaning: '변치 않는 마음', shape: 'statice', art: 'head', size: 0.9,
      vibes: ['natural', 'calm'], moods: ['thanks', 'comfort', 'love'],
      colors: [ { id: 'purple' }, { id: 'lavender' }, { id: 'white' }, { id: 'yellow' } ] },

    { id: 'waxflower', name: '왁스플라워', group: 'filler', meaning: '변덕스러운 매력', shape: 'waxflower', art: 'head', size: 0.85,
      vibes: ['cute', 'natural'], moods: ['celebrate', 'love'], // 확인 필요
      colors: [ { id: 'blush' }, { id: 'white' }, { id: 'pink' } ] },

    { id: 'gomphrena', name: '천일홍', group: 'filler', meaning: '변치 않는 사랑', shape: 'gomphrena', art: 'head', size: 0.8,
      vibes: ['cute', 'bright'], moods: ['love', 'thanks'],
      colors: [ { id: 'pink' }, { id: 'purple' }, { id: 'white' }, { id: 'red' } ] },

    { id: 'matricaria', name: '마트리카리아', group: 'filler', meaning: '역경에 굴하지 않는 강인함', shape: 'matricaria', art: 'head', size: 0.85,
      vibes: ['natural', 'bright'], moods: ['cheer', 'comfort'], // 확인 필요
      colors: [ { id: 'white' } ] },

    /* ── 잎 소재 ─────────────────────────────── */
    { id: 'eucalyptus', name: '유칼립투스', group: 'leaf', meaning: '추억', shape: 'eucalyptus', art: 'sprig', size: 1,
      vibes: ['natural', 'calm', 'elegant'], moods: ['comfort', 'thanks'],
      colors: [ { id: 'sage' } ] },

    { id: 'ruscus', name: '루스커스', group: 'leaf', meaning: '변하지 않는 마음', shape: 'ruscus', art: 'sprig', size: 1,
      vibes: ['elegant', 'natural'], moods: ['thanks', 'love'], // 확인 필요
      colors: [ { id: 'leaf' } ] },

    { id: 'lemon-leaf', name: '레몬잎', group: 'leaf', meaning: '변함없는 사랑', shape: 'lemonleaf', art: 'sprig', size: 1,
      vibes: ['natural', 'calm'], moods: ['love', 'thanks'], // 확인 필요
      colors: [ { id: 'deepgreen' } ] },

    { id: 'misty-blue', name: '미스티블루', group: 'leaf', meaning: '청초한 사랑', shape: 'mistyblue', art: 'sprig', size: 1,
      vibes: ['cute', 'calm'], moods: ['love', 'comfort'], // 확인 필요
      colors: [ { id: 'mistblue' } ] }
  ],

  /* 꽃 목록의 분류 이름 */
  groups: [
    { id: 'main',   name: '메인 꽃' },
    { id: 'filler', name: '채움 꽃' },
    { id: 'leaf',   name: '잎 소재' }
  ],

  /* ---------------------------------------------------------------
     포장지
     style: 'paper' 무지 종이 / 'kraft' 크라프트 / 'sheer' 반투명 / 'news' 영자 신문
     tags : 추천 받기에서 어울리는 분위기·색감 (꽃의 vibes, 색의 tones와 같은 이름)
     --------------------------------------------------------------- */
  wraps: [
    { id: 'kraft',    name: '크라프트',     hex: '#C49A6C', style: 'kraft', tags: ['natural', 'warm'] },
    { id: 'hanji',    name: '미색 한지',    hex: '#EEE4CF', style: 'kraft', tags: ['natural', 'calm', 'warm', 'white'] },
    { id: 'white',    name: '화이트 무광',  hex: '#F7F5F0', style: 'paper', tags: ['elegant', 'calm', 'white'] },
    { id: 'blush',    name: '더스티 핑크',  hex: '#E3BDB8', style: 'paper', tags: ['cute', 'pastel', 'warm'] },
    { id: 'sage',     name: '세이지 그린',  hex: '#B9C6AE', style: 'paper', tags: ['natural', 'calm', 'white', 'cool'] },
    { id: 'charcoal', name: '차콜',         hex: '#3B3936', style: 'paper', tags: ['elegant', 'vivid'] },
    { id: 'sheer',    name: '투명 셀로판',  hex: '#FFFFFF', style: 'sheer', tags: ['cute', 'bright', 'pastel', 'cool'] },
    { id: 'news',     name: '영자 신문',    hex: '#E8E2D4', style: 'news', tags: ['natural', 'bright'] }
  ],

  /* 리본 — style: 'satin' 광택 리본 / 'sheer' 얇은 시폰 / 'twine' 마끈 */
  ribbons: [
    { id: 'ivory',    name: '아이보리 새틴', hex: '#F0E6D2', style: 'satin', tags: ['elegant', 'white', 'calm'] },
    { id: 'blush',    name: '블러쉬 실크',   hex: '#E6B3AE', style: 'satin', tags: ['cute', 'pastel', 'love'] },
    { id: 'burgundy', name: '버건디 벨벳',   hex: '#6A1E2D', style: 'satin', tags: ['elegant', 'warm', 'vivid', 'love'] },
    { id: 'sage',     name: '세이지 시폰',   hex: '#A7B69B', style: 'sheer', tags: ['natural', 'cool', 'calm'] },
    { id: 'black',    name: '블랙 그로그랭', hex: '#2B2928', style: 'satin', tags: ['elegant', 'vivid'] },
    { id: 'twine',    name: '마끈',          hex: '#A9855B', style: 'twine', tags: ['natural', 'warm'] }
  ],

  /* ---------------------------------------------------------------
     전하고 싶은 마음 (추천 받기)
     en     : 타일에 작게 붙는 영문 라벨
     letter : 엽서 문구에 들어가는 마음 한 줄
     --------------------------------------------------------------- */
  moods: [
    { id: 'celebrate', en: 'CELEBRATE', name: '축하',   desc: '기쁜 날을 함께',       letter: '오늘 같은 날, 누구보다 크게 축하하고 싶었어요.' },
    { id: 'cheer', en: 'CHEER UP',     name: '응원',   desc: '새 출발을 앞둔 사람에게', letter: '어떤 길을 가든 늘 당신 편이라는 걸 잊지 말아요.' },
    { id: 'thanks', en: 'THANK YOU',    name: '고마움', desc: '말로 다 못 한 감사',    letter: '말로는 다 전하지 못한 고마움을 꽃에 대신 담아요.' },
    { id: 'love', en: 'LOVE',      name: '사랑',   desc: '좋아하는 마음 그대로',   letter: '오늘도, 내일도 당신을 많이 좋아해요.' },
    { id: 'comfort', en: 'COMFORT',   name: '위로',   desc: '지친 하루에 건네는 꽃', letter: '애쓴 오늘의 당신 곁에 조용히 이 꽃을 두고 갈게요.' },
    { id: 'sorry', en: 'SORRY',     name: '미안함', desc: '먼저 내미는 손',        letter: '먼저 미안하다고 말하고 싶어서, 꽃에 마음을 실어 보내요.' }
  ],

  /* 마음을 고르지 않았을 때 쓰는 문구 */
  postcard: {
    defaultTo: '소중한 당신',
    defaultLetter: '한 송이씩 고르는 동안 내내 당신을 생각했어요.',
    closing: '그 마음들을 모아 한 다발로 엮었어요.'
  },

  /* ---------------------------------------------------------------
     추천 받기 질문
     질문 하나에 보기 여러 개. 보기를 고르면 tags에 적힌 점수가 더해져요.
     tags에 쓸 수 있는 이름
       마음   celebrate cheer thanks love comfort sorry
       분위기 bright calm elegant cute natural
       색감   warm cool pastel white vivid
       꽃     꽃 id (예: carnation: 3 은 카네이션에 3점, lily: -9 는 백합을 빼요)
     숫자가 클수록 많이 반영돼요. 질문을 빼거나 순서를 바꿔도 괜찮아요.
     mood 질문은 위의 '전하고 싶은 마음'을 그대로 보기로 써요.
     --------------------------------------------------------------- */
  quiz: [
    { id: 'who', en: 'FOR WHOM', title: '누구에게 선물하나요?', sub: '받는 사람을 떠올리며 골라 주세요.',
      options: [
        { id: 'lover',    name: '연인·배우자', desc: '가장 가까운 사람', tags: { love: 2, rose: 1 } },
        { id: 'parents',  name: '부모님',      desc: '늘 고마운 분들',   tags: { thanks: 2, carnation: 1, elegant: 0.5 } },
        { id: 'friend',   name: '친구',        desc: '편하고 다정하게', tags: { cheer: 1, celebrate: 1, cute: 1 } },
        { id: 'teacher',  name: '선생님·은사', desc: '존경을 담아',     tags: { thanks: 2, elegant: 1 } },
        { id: 'coworker', name: '동료·상사',   desc: '단정하고 깔끔하게', tags: { elegant: 1, calm: 1, celebrate: 0.5 } },
        { id: 'me',       name: '나 자신',     desc: '오늘의 나에게',   tags: { comfort: 1, natural: 1 } }
      ] },

    { id: 'age', en: 'AGE', title: '받는 분의 나이대는요?', sub: '나이대에 어울리는 분위기를 살짝 더해요.',
      options: [
        { id: '10s', name: '10대',     tags: { cute: 2, bright: 1, pastel: 1 } },
        { id: '20s', name: '20대',     tags: { cute: 1, natural: 1, pastel: 1 } },
        { id: '30s', name: '30대',     tags: { natural: 1, elegant: 1 } },
        { id: '40s', name: '40대',     tags: { elegant: 1, calm: 1 } },
        { id: '50s', name: '50대',     tags: { elegant: 1, warm: 1 } },
        { id: '60s', name: '60대 이상', tags: { elegant: 1, warm: 1, vivid: 0.5 } }
      ] },

    { id: 'gender', en: 'GENDER', title: '받는 분의 성별은요?', sub: '색과 분위기를 정할 때 아주 조금만 참고해요.',
      options: [
        { id: 'female', name: '여성',     tags: { pastel: 0.5 } },
        { id: 'male',   name: '남성',     tags: { natural: 0.5, calm: 0.5 } },
        { id: 'any',    name: '상관없음', tags: {} }
      ] },

    { id: 'occasion', en: 'OCCASION', title: '어떤 날인가요?', sub: '날에 맞는 꽃말을 먼저 찾아요.',
      options: [
        { id: 'birthday',    name: '생일',             tags: { celebrate: 2, bright: 1 } },
        { id: 'anniversary', name: '기념일·고백',      tags: { love: 2, elegant: 1, rose: 1 } },
        { id: 'graduation',  name: '졸업·입학',        tags: { cheer: 2, celebrate: 1, bright: 1, freesia: 1 } },
        { id: 'promotion',   name: '승진·개업',        tags: { celebrate: 2, cheer: 1, elegant: 1 } },
        { id: 'thanksday',   name: '어버이날·스승의 날', tags: { thanks: 3, carnation: 3 } },
        { id: 'hospital',    name: '병문안',           desc: '향이 강한 백합은 빼요', tags: { comfort: 3, calm: 1, lily: -9 } },
        { id: 'apology',     name: '화해',             tags: { sorry: 3, calm: 1 } },
        { id: 'justbecause', name: '그냥, 이유 없이',  tags: { natural: 1 } }
      ] },

    { id: 'mood', en: 'MESSAGE', title: '어떤 마음을 전하고 싶나요?', sub: '고른 마음은 엽서 문구에도 들어가요.' },

    { id: 'vibe', en: 'VIBE', title: '어떤 분위기가 좋을까요?', sub: '꽃의 모양과 포장지를 고를 때 반영해요.',
      options: [
        { id: 'bright',  name: '화사한',     desc: '보는 순간 환해지는',   adj: '화사한',     tags: { bright: 3 } },
        { id: 'calm',    name: '차분한',     desc: '조용하고 편안한',     adj: '차분한',     tags: { calm: 3 } },
        { id: 'elegant', name: '우아한',     desc: '고급스럽고 단정한',   adj: '우아한',     tags: { elegant: 3 } },
        { id: 'cute',    name: '사랑스러운', desc: '작고 동글동글한',     adj: '사랑스러운', tags: { cute: 3 } },
        { id: 'natural', name: '자연스러운', desc: '들에서 막 꺾어 온 듯', adj: '자연스러운', tags: { natural: 3 } }
      ] },

    { id: 'tone', en: 'COLOR', title: '전체 색감은요?', sub: '꽃다발 전체의 색을 정해요.',
      options: [
        { id: 'warm',   name: '따뜻한 색',   swatch: ['red', 'orange', 'yellow', 'peach'],       tags: { warm: 3 } },
        { id: 'cool',   name: '시원한 색',   swatch: ['blue', 'skyblue', 'lavender', 'purple'],  tags: { cool: 3 } },
        { id: 'pastel', name: '파스텔',      swatch: ['blush', 'peach', 'lavender', 'skyblue'],  tags: { pastel: 3 } },
        { id: 'white',  name: '화이트&그린', swatch: ['white', 'cream', 'green', 'sage'],        tags: { white: 3 } },
        { id: 'vivid',  name: '선명한 색',   swatch: ['red', 'yellow', 'purple', 'blue'],        tags: { vivid: 3 } }
      ] }
  ],

  /* 분위기를 고르지 않았을 때 추천 이름에 붙는 말 */
  vibeWords: { bright: '화사한', calm: '차분한', elegant: '우아한', cute: '사랑스러운', natural: '자연스러운' },

  /* ---------------------------------------------------------------
     추천 조합 (대표 조합)
     items : [꽃id, 색id, 송이 수]
     photo : AI 실사 미리보기 이미지 파일 이름 (images/real 폴더 안)
             파일을 넣기 전까지는 "준비 중" 안내가 나와요.
     --------------------------------------------------------------- */
  recipes: [
    { id: 'sunny-day', name: '햇살 같은 축하', moods: ['celebrate', 'cheer'],
      note: '해바라기의 동경과 프리지아의 새로운 시작을 함께 담았어요.',
      items: [['sunflower', 'yellow', 3], ['freesia', 'yellow', 3], ['matricaria', 'white', 4], ['eucalyptus', 'sage', 3]],
      wrap: 'kraft', ribbon: 'ivory', photo: 'sunny-day.jpg' },

    { id: 'blush-wedding', name: '수줍은 축복', moods: ['celebrate', 'love'],
      note: '작약의 행복한 결혼과 안개꽃의 맑은 마음.',
      items: [['peony', 'blush', 3], ['spray-rose', 'white', 3], ['gypsophila', 'white', 5], ['eucalyptus', 'sage', 2]],
      wrap: 'white', ribbon: 'blush', photo: 'blush-wedding.jpg' },

    { id: 'bright-mood', name: '웃음 한 다발', moods: ['celebrate'],
      note: '거베라의 희망에 라넌큘러스의 매력을 더했어요.',
      items: [['gerbera', 'orange', 3], ['ranunculus', 'peach', 3], ['waxflower', 'blush', 4], ['ruscus', 'leaf', 2]],
      wrap: 'blush', ribbon: 'ivory', photo: 'bright-mood.jpg' },

    { id: 'new-start', name: '새 출발 응원', moods: ['cheer'],
      note: '"당신을 행복하게 해 줄게요" 델피니움과 새로운 시작의 프리지아.',
      items: [['delphinium', 'blue', 2], ['freesia', 'yellow', 3], ['statice', 'lavender', 3], ['ruscus', 'leaf', 2]],
      wrap: 'white', ribbon: 'sage', photo: 'new-start.jpg' },

    { id: 'warm-hand', name: '따뜻한 손길', moods: ['cheer', 'thanks'],
      note: '알스트로메리아의 배려와 소국의 밝은 마음.',
      items: [['alstroemeria', 'peach', 3], ['chrysanthemum', 'white', 4], ['sweet-pea', 'pink', 2], ['lemon-leaf', 'deepgreen', 2]],
      wrap: 'hanji', ribbon: 'twine', photo: 'warm-hand.jpg' },

    { id: 'grateful', name: '고마운 마음', moods: ['thanks'],
      note: '분홍 카네이션의 감사와 분홍 장미의 행복한 사랑.',
      items: [['carnation', 'pink', 3], ['rose', 'pink', 3], ['gypsophila', 'white', 4], ['eucalyptus', 'sage', 2]],
      wrap: 'blush', ribbon: 'ivory', photo: 'grateful.jpg' },

    { id: 'respect', name: '존경을 담아', moods: ['thanks'],
      note: '흰 장미의 존경과 리시안셔스의 변치 않는 마음.',
      items: [['rose', 'white', 3], ['lisianthus', 'lavender', 3], ['statice', 'purple', 3], ['lemon-leaf', 'deepgreen', 2]],
      wrap: 'charcoal', ribbon: 'ivory', photo: 'respect.jpg' },

    { id: 'red-heart', name: '열렬한 고백', moods: ['love'],
      note: '빨간 장미의 열렬한 사랑, 가장 클래식한 고백.',
      items: [['rose', 'red', 5], ['gypsophila', 'white', 5], ['eucalyptus', 'sage', 3]],
      wrap: 'charcoal', ribbon: 'burgundy', photo: 'red-heart.jpg' },

    { id: 'soft-love', name: '포근한 사랑', moods: ['love'],
      note: '라넌큘러스의 매혹과 "그대를 사랑해" 빨간 아네모네.',
      items: [['ranunculus', 'pink', 3], ['anemone', 'red', 2], ['tulip', 'pink', 3], ['waxflower', 'blush', 3]],
      wrap: 'sheer', ribbon: 'blush', photo: 'soft-love.jpg' },

    { id: 'quiet-comfort', name: '조용한 위로', moods: ['comfort'],
      note: '수국의 진심과 유칼립투스의 추억을 함께.',
      items: [['hydrangea', 'skyblue', 2], ['lisianthus', 'white', 3], ['eucalyptus', 'sage', 3]],
      wrap: 'white', ribbon: 'sage', photo: 'quiet-comfort.jpg' },

    { id: 'evening-sky', name: '저녁 하늘', moods: ['comfort'],
      note: '델피니움과 스타티스, 차분한 푸른빛의 위로.',
      items: [['delphinium', 'skyblue', 2], ['stock', 'white', 2], ['statice', 'lavender', 3], ['misty-blue', 'mistblue', 2]],
      wrap: 'hanji', ribbon: 'twine', photo: 'evening-sky.jpg' },

    { id: 'forgive-me', name: '먼저 건네는 마음', moods: ['sorry'],
      note: '흰 튤립의 용서와 새로운 시작.',
      items: [['tulip', 'white', 5], ['sweet-pea', 'lavender', 2], ['eucalyptus', 'sage', 2]],
      wrap: 'sage', ribbon: 'ivory', photo: 'forgive-me.jpg' },

    { id: 'make-up', name: '다시, 우리', moods: ['sorry', 'thanks'],
      note: '분홍 튤립의 배려와 알스트로메리아의 새로운 만남.',
      items: [['tulip', 'pink', 3], ['alstroemeria', 'pink', 3], ['matricaria', 'white', 3], ['lemon-leaf', 'deepgreen', 2]],
      wrap: 'news', ribbon: 'twine', photo: 'make-up.jpg' }
  ]
};

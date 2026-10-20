# 꽃 그림 넣는 곳

이 폴더에 PNG를 넣으면 사이트가 자동으로 코드 그림 대신 그 그림을 씁니다.
파일이 없는 꽃은 계속 코드 그림으로 나오니, 한 장씩 천천히 채워도 괜찮아요.

## 파일 이름 규칙

`꽃id-색id.png` — 전부 영어 소문자, 띄어쓰기 대신 `-`

예) 빨간 장미 → `rose-red.png`, 연핑크 작약 → `peony-blush.png`

꽃id와 색id는 `data.js`에 적힌 그대로입니다. 꽃이나 색을 `data.js`에서 추가하면 파일 이름도 그 규칙대로 늘어나요.

## 그림 기준 (꼭 맞춰 주세요)

공통: **배경 투명 PNG**, 그림자·바닥 없음, 글자·워터마크 없음, 모든 그림이 같은 그림체(같은 일러스트 세트)면 가장 예뻐요.

| 비율 | 크기 | 어떤 꽃 | 그리는 법 |
|---|---|---|---|
| 정사각형 | 800 × 800 px | 대부분의 메인 꽃, 채움 꽃 | **꽃 머리만** (줄기는 없거나 아주 짧게). 꽃 중심이 그림 정중앙. 꽃이 가로·세로의 85~90%를 채우게. 각도는 **정면에서 살짝 위(약 20~30°)에서 내려다본 모습**. 튤립·프리지아·스위트피·알스트로메리아처럼 옆모습이 자연스러운 꽃은 옆모습도 괜찮아요. 채움 꽃(안개꽃 등)은 작은 꽃송이가 모인 덩어리 하나. |
| 세로로 긴 | 600 × 1200 px | 델피니움, 칼라, 스토크 | 꽃대 전체를 **위로 곧게** 세운 모습. **줄기 끝이 그림 맨 아래 가운데**에 닿게. 좌우 여백 조금. |
| 세로로 긴 | 600 × 1200 px | 잎 소재 4종 | 가지 하나를 **위로 곧게** 세운 모습. **줄기 끝이 그림 맨 아래 가운데**에 닿게. |

- 크기가 정확히 같지 않아도 비율(1:1, 1:2)만 맞으면 됩니다. 더 커도 괜찮아요(예: 1600 × 1600).
- 사이트에서 기울이고 겹치는 건 코드가 하니까, 그림 자체는 **똑바로** 세워 주세요.
- 꽃다발 안에서의 크기는 `data.js`의 `size` 값으로 조절해요 (1이 보통, 1.2면 20% 크게).
- 다 넣은 뒤 그림이 너무 크거나 작아 보이면 `size`만 고치면 됩니다.

## 필요한 파일 전체 목록

### 메인 꽃

| 꽃 | 비율 | 파일 이름 |
|---|---|---|
| 장미 | 정사각형 | `rose-red.png` `rose-pink.png` `rose-white.png` `rose-yellow.png` `rose-orange.png` `rose-lavender.png` |
| 스프레이 장미 | 정사각형 | `spray-rose-pink.png` `spray-rose-blush.png` `spray-rose-white.png` `spray-rose-peach.png` |
| 튤립 | 정사각형 | `tulip-red.png` `tulip-pink.png` `tulip-white.png` `tulip-yellow.png` `tulip-purple.png` |
| 작약 | 정사각형 | `peony-blush.png` `peony-pink.png` `peony-white.png` `peony-coral.png` |
| 라넌큘러스 | 정사각형 | `ranunculus-peach.png` `ranunculus-pink.png` `ranunculus-white.png` `ranunculus-yellow.png` `ranunculus-red.png` `ranunculus-orange.png` |
| 거베라 | 정사각형 | `gerbera-orange.png` `gerbera-pink.png` `gerbera-yellow.png` `gerbera-red.png` `gerbera-white.png` |
| 카네이션 | 정사각형 | `carnation-red.png` `carnation-pink.png` `carnation-white.png` `carnation-green.png` |
| 리시안셔스 | 정사각형 | `lisianthus-white.png` `lisianthus-lavender.png` `lisianthus-blush.png` `lisianthus-purple.png` `lisianthus-green.png` |
| 수국 | 정사각형 | `hydrangea-skyblue.png` `hydrangea-blue.png` `hydrangea-pink.png` `hydrangea-white.png` `hydrangea-lavender.png` `hydrangea-green.png` |
| 해바라기 | 정사각형 | `sunflower-yellow.png` |
| 프리지아 | 정사각형 | `freesia-yellow.png` `freesia-white.png` `freesia-lavender.png` |
| 백합 | 정사각형 | `lily-white.png` `lily-pink.png` `lily-yellow.png` |
| 소국 | 정사각형 | `chrysanthemum-white.png` `chrysanthemum-yellow.png` `chrysanthemum-green.png` `chrysanthemum-pink.png` |
| 알스트로메리아 | 정사각형 | `alstroemeria-pink.png` `alstroemeria-peach.png` `alstroemeria-white.png` `alstroemeria-yellow.png` `alstroemeria-lavender.png` |
| 아네모네 | 정사각형 | `anemone-red.png` `anemone-white.png` `anemone-purple.png` `anemone-pink.png` |
| 델피니움 | 세로로 긴 | `delphinium-blue.png` `delphinium-skyblue.png` `delphinium-white.png` `delphinium-purple.png` |
| 스위트피 | 정사각형 | `sweet-pea-pink.png` `sweet-pea-lavender.png` `sweet-pea-white.png` `sweet-pea-coral.png` |
| 칼라 | 세로로 긴 | `calla-white.png` `calla-yellow.png` `calla-burgundy.png` `calla-pink.png` |
| 스토크 | 세로로 긴 | `stock-white.png` `stock-pink.png` `stock-lavender.png` `stock-purple.png` |

### 채움 꽃

| 꽃 | 비율 | 파일 이름 |
|---|---|---|
| 안개꽃 | 정사각형 | `gypsophila-white.png` `gypsophila-pink.png` |
| 스타티스 | 정사각형 | `statice-purple.png` `statice-lavender.png` `statice-white.png` `statice-yellow.png` |
| 왁스플라워 | 정사각형 | `waxflower-blush.png` `waxflower-white.png` `waxflower-pink.png` |
| 천일홍 | 정사각형 | `gomphrena-pink.png` `gomphrena-purple.png` `gomphrena-white.png` `gomphrena-red.png` |
| 마트리카리아 | 정사각형 | `matricaria-white.png` |

### 잎 소재

| 꽃 | 비율 | 파일 이름 |
|---|---|---|
| 유칼립투스 | 세로로 긴 | `eucalyptus-sage.png` |
| 루스커스 | 세로로 긴 | `ruscus-leaf.png` |
| 레몬잎 | 세로로 긴 | `lemon-leaf-deepgreen.png` |
| 미스티블루 | 세로로 긴 | `misty-blue-mistblue.png` |

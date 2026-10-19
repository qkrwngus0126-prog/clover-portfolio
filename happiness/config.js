/* 사이트 설정. 이 파일만 고치면 됩니다.

   supabaseUrl  : Supabase 프로젝트 주소 (https://xxxx.supabase.co)
   supabaseKey  : 공개용 키 — "Publishable key"(sb_publishable_로 시작) 또는 "anon public" 키
                  ⚠️ "secret" / "service_role" 키는 절대 넣지 마세요. 넣으면 사이트가 스스로 멈춥니다.

   둘 다 비워 두면 저장 없이 예시 기록으로만 움직이는 미리보기 모드로 열립니다. */
window.HAPPY_CONFIG = {
  supabaseUrl: 'https://kddwszxlmdlkgskxmwgg.supabase.co',
  supabaseKey: 'sb_publishable_UD4h3VkCUPhEbG8D5zLbxA_Qq18y5BY',

  // 사진을 넣을 Storage 버킷 이름 (supabase-setup.sql과 같아야 해요)
  photoBucket: 'happy-photos',

  // 로그인 버튼 목록. 카카오를 켜려면 Supabase에서 Kakao를 켠 뒤 아래 줄의 // 를 지우면 됩니다.
  loginProviders: [
    { id: 'google', label: 'Google로 계속하기' },
    // { id: 'kakao', label: '카카오로 계속하기' },
  ],

  // 들판에 함께 숨겨 둘 빈 세잎 개수
  emptyClovers: 5,
};

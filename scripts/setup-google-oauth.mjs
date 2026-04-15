import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis.js';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// .env.local 로드
config({ path: envPath });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const REDIRECT_URL = 'http://localhost:53682/oauth2callback';

console.log('\n════════════════════════════════════════════════════════════');
console.log('   🔐 Google OAuth 2.0 인증 설정');
console.log('════════════════════════════════════════════════════════════\n');

// 1️⃣ 환경변수 확인
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('❌ 환경변수 누락: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET\n');
  console.log('📋 GCP 콘솔에서 OAuth 클라이언트 ID를 발급하세요:\n');

  console.log('【GCP 콘솔 설정 단계】\n');
  console.log('1. GCP 콘솔 방문: https://console.cloud.google.com/\n');
  console.log('2. 프로젝트 선택 또는 생성\n');
  console.log('3. 좌측 메뉴 → "API 및 서비스" → "라이브러리"\n');
  console.log('4. 다음 API 검색해서 활성화:\n');
  console.log('   ✓ Gmail API\n');
  console.log('   ✓ Google Calendar API\n');
  console.log('   ✓ Google Drive API\n');
  console.log('   ✓ Google Sheets API\n');
  console.log('5. "API 및 서비스" → "OAuth 동의 화면"\n');
  console.log('   - User Type: "외부" 선택\n');
  console.log('   - 앱 정보 입력\n');
  console.log('   - 범위(Scopes) 추가:\n');
  console.log('     * gmail.readonly\n');
  console.log('     * calendar.readonly\n');
  console.log('     * drive.metadata.readonly\n');
  console.log('     * spreadsheets.readonly\n');
  console.log('   - 테스트 사용자에 본인 이메일 추가\n');
  console.log('6. "API 및 서비스" → "사용자 인증 정보"\n');
  console.log('   - "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"\n');
  console.log('   - 애플리케이션 유형: "데스크톱 앱"\n');
  console.log('   - 생성된 ID와 보안 비밀번호 복사\n\n');

  console.log('【.env.local에 추가】\n');
  console.log(`GOOGLE_OAUTH_CLIENT_ID=<발급받은 Client ID>\n`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET=<발급받은 Client Secret>\n\n`);

  console.log('설정 후 다시 실행해주세요:\n');
  console.log('$ npm run setup:google\n');

  process.exit(1);
}

// 2️⃣ 토큰이 이미 있으면 스킵
if (REFRESH_TOKEN) {
  console.log('✅ 이미 인증되었습니다! (Refresh Token이 존재)\n');
  console.log('💡 다음 명령어로 데이터를 가져오세요:\n');
  console.log('$ npm run fetch:all\n');
  process.exit(0);
}

// 3️⃣ OAuth 인증 플로우 시작
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // 매번 동의 화면 표시
});

console.log('🔗 다음 URL을 브라우저에서 열어주세요:\n');
console.log(authUrl + '\n');

console.log('⏳ 콜백 대기 중... (localhost:53682에서 수신 중)\n');

// 콜백 서버 시작
import http from 'http';

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ 인증 실패</h2><p>에러: ${error}</p><p>브라우저를 닫고 다시 시도해주세요.</p>`);
      server.close();
      process.exit(1);
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>❌ 인증 코드 없음</h2>');
      server.close();
      process.exit(1);
      return;
    }

    try {
      // 코드를 토큰으로 교환
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        throw new Error('Refresh token을 받지 못했습니다. 다시 시도해주세요.');
      }

      // .env.local에 저장
      let envContent = fs.readFileSync(envPath, 'utf-8');

      // 기존 REFRESH_TOKEN 제거
      envContent = envContent.replace(
        /GOOGLE_OAUTH_REFRESH_TOKEN=.*/g,
        ''
      ).trim();

      // 새 토큰 추가
      envContent += `\nGOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}\n`;

      fs.writeFileSync(envPath, envContent);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <head><title>✅ 인증 완료</title></head>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>✅ 인증 완료!</h1>
            <p>Refresh Token이 .env.local에 저장되었습니다.</p>
            <p style="margin-top: 20px; color: #666;">
              <strong>다음 단계:</strong><br>
              터미널에서 다음 명령어를 실행하세요:<br>
              <code>npm run fetch:all</code>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              이 창은 자동으로 닫힙니다.
            </p>
          </body>
        </html>
      `);

      server.close();

      console.log('✅ 인증 성공!\n');
      console.log('📝 Refresh Token이 .env.local에 저장되었습니다.\n');
      console.log('💡 다음 명령어로 데이터를 가져오세요:\n');
      console.log('$ npm run fetch:all\n');

      process.exit(0);
    } catch (error) {
      console.error('❌ 토큰 교환 오류:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ 오류</h2><p>${error.message}</p>`);
      server.close();
      process.exit(1);
    }
  }
});

server.listen(53682);

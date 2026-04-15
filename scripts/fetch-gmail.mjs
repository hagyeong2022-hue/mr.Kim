import { google } from 'googleapis';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ 환경변수 누락: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN');
  console.error('💡 먼저 npm run setup:google을 실행하세요.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:53682/oauth2callback'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

try {
  console.log('📧 Gmail: 읽지 않은 이메일 가져오는 중...');

  // 읽지 않은 이메일 목록 조회
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 10,
  });

  const messages = response.data.messages || [];
  const totalUnread = response.data.resultSizeEstimate || 0;

  // 각 메시지의 상세 정보 가져오기
  const emailData = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '알 수 없음';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(제목 없음)';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      return {
        id: msg.id,
        from,
        subject,
        date: new Date(date).toLocaleString('ko-KR'),
        snippet: detail.data.snippet || '',
      };
    })
  );

  // 결과 저장
  const outputPath = path.join(__dirname, '..', 'gmail-data.json');
  const data = {
    updated_at: new Date().toISOString(),
    total_unread: totalUnread,
    source: 'google-api',
    messages: emailData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Gmail 데이터 저장됨: ${outputPath}`);
  console.log(`   📧 읽지 않은 이메일: ${totalUnread}개`);
  console.log(`   📨 가져온 메시지: ${emailData.length}개\n`);
} catch (error) {
  console.error('❌ Gmail API 오류:', error.message);
  process.exit(1);
}

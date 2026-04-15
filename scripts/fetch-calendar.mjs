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
  console.error('❌ 환경변수 누락');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:53682/oauth2callback'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

try {
  console.log('📅 Calendar: 오늘부터 7일간 이벤트 가져오는 중...');

  // 오늘 자정부터 7일 뒤 자정까지
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 7);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  const eventData = events.map((event) => ({
    id: event.id,
    title: event.summary || '(제목 없음)',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || '',
    description: event.description || '',
  }));

  const outputPath = path.join(__dirname, '..', 'calendar-data.json');
  const data = {
    updated_at: new Date().toISOString(),
    source: 'google-api',
    events: eventData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Calendar 데이터 저장됨: ${outputPath}`);
  console.log(`   📆 이벤트 개수: ${eventData.length}개\n`);
} catch (error) {
  console.error('❌ Calendar API 오류:', error.message);
  process.exit(1);
}

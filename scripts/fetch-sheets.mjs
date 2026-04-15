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
const SHEETS_TARGET_ID = process.env.SHEETS_TARGET_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ 환경변수 누락');
  process.exit(1);
}

if (!SHEETS_TARGET_ID) {
  console.warn('⚠️ SHEETS_TARGET_ID 환경변수가 없습니다.');
  console.warn('💡 Google Sheets 연동을 사용하려면 .env.local에 다음을 추가하세요:');
  console.warn('   SHEETS_TARGET_ID=<스프레드시트 ID>\n');
  console.warn('   스프레드시트 ID는 URL에서 찾을 수 있습니다:');
  console.warn('   https://docs.google.com/spreadsheets/d/[ID]/edit\n');

  // 샘플 데이터 생성
  const outputPath = path.join(__dirname, '..', 'sheets-data.json');
  const data = {
    updated_at: new Date().toISOString(),
    source: 'mock',
    message: 'SHEETS_TARGET_ID 환경변수를 설정해주세요',
    data: [],
  };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('📊 샘플 Sheets 데이터 생성됨\n');
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:53682/oauth2callback'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

try {
  console.log('📊 Sheets: 데이터 가져오는 중...');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_TARGET_ID,
    range: 'Sheet1!A1:Z20',
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];
  const dataRows = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || '';
    });
    return obj;
  });

  const outputPath = path.join(__dirname, '..', 'sheets-data.json');
  const data = {
    updated_at: new Date().toISOString(),
    source: 'google-api',
    spreadsheet_id: SHEETS_TARGET_ID,
    headers,
    data: dataRows,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Sheets 데이터 저장됨: ${outputPath}`);
  console.log(`   📋 행 개수: ${dataRows.length}개\n`);
} catch (error) {
  console.error('❌ Sheets API 오류:', error.message);
  process.exit(1);
}

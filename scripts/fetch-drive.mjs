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

const drive = google.drive({ version: 'v3', auth: oauth2Client });

try {
  console.log('📁 Drive: 최근 수정된 파일 가져오는 중...');

  const response = await drive.files.list({
    pageSize: 10,
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, owners)',
    orderBy: 'modifiedTime desc',
  });

  const files = response.data.files || [];

  const fileData = files.map((file) => {
    const mimeType = file.mimeType || 'application/octet-stream';
    const fileType = mimeType.includes('folder')
      ? '폴더'
      : mimeType.includes('sheet')
      ? '시트'
      : mimeType.includes('document')
      ? '문서'
      : mimeType.includes('presentation')
      ? '프레젠테이션'
      : mimeType.includes('video')
      ? '동영상'
      : mimeType.includes('image')
      ? '이미지'
      : '파일';

    return {
      id: file.id,
      name: file.name,
      mimeType,
      fileType,
      modifiedTime: new Date(file.modifiedTime).toLocaleString('ko-KR'),
      webLink: file.webViewLink,
      owner: file.owners?.[0]?.displayName || '알 수 없음',
    };
  });

  const outputPath = path.join(__dirname, '..', 'drive-data.json');
  const data = {
    updated_at: new Date().toISOString(),
    source: 'google-api',
    files: fileData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Drive 데이터 저장됨: ${outputPath}`);
  console.log(`   📄 파일 개수: ${fileData.length}개\n`);
} catch (error) {
  console.error('❌ Drive API 오류:', error.message);
  process.exit(1);
}

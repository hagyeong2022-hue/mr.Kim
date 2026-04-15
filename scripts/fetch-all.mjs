import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: 'Gmail', file: 'fetch-gmail.mjs' },
  { name: 'Calendar', file: 'fetch-calendar.mjs' },
  { name: 'Drive', file: 'fetch-drive.mjs' },
  { name: 'Sheets', file: 'fetch-sheets.mjs' },
];

console.log('\n════════════════════════════════════════════════════════════');
console.log('   📊 Google 서비스 데이터 일괄 가져오기');
console.log('════════════════════════════════════════════════════════════\n');

let completed = 0;
let failed = 0;

const runScript = (script) => {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, script.file)], {
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        completed++;
      } else {
        failed++;
      }
      resolve();
    });

    child.on('error', () => {
      failed++;
      resolve();
    });
  });
};

(async () => {
  for (const script of scripts) {
    await runScript(script);
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('   ✅ 완료');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`✅ 성공: ${completed}개`);
  console.log(`❌ 실패: ${failed}개\n`);

  if (completed > 0) {
    console.log('💡 dashboard.html을 새로고침하면 데이터가 표시됩니다!\n');
  }
})();

# 🔐 Google OAuth 2.0 설정 가이드

Google Gmail, Calendar, Drive, Sheets를 대시보드와 연동하는 방법입니다.

## 📋 목차

1. [전체 흐름](#전체-흐름)
2. [GCP 프로젝트 설정](#gcp-프로젝트-설정)
3. [OAuth 클라이언트 ID 발급](#oauth-클라이언트-id-발급)
4. [환경변수 설정](#환경변수-설정)
5. [인증 및 데이터 가져오기](#인증-및-데이터-가져오기)
6. [자주 묻는 질문](#자주-묻는-질문)

---

## 전체 흐름

```
1. GCP 콘솔에서 프로젝트 생성
   ↓
2. Google API 활성화 (Gmail, Calendar, Drive, Sheets)
   ↓
3. OAuth 동의 화면 설정
   ↓
4. OAuth 클라이언트 ID 발급
   ↓
5. .env.local에 Client ID & Secret 추가
   ↓
6. npm run setup:google (브라우저 인증)
   ↓
7. npm run fetch:all (데이터 가져오기)
   ↓
8. dashboard.html 새로고침 ✅
```

---

## GCP 프로젝트 설정

### 1️⃣ GCP 콘솔 접속

👉 [Google Cloud Console](https://console.cloud.google.com/)

### 2️⃣ 프로젝트 생성 또는 선택

- 상단 "프로젝트 선택" → "새 프로젝트"
- 프로젝트 이름: `kimbiseo-dashboard` (예시)
- 지역: `Asia Pacific (서울)`
- "만들기" 클릭

### 3️⃣ Google API 활성화

다음 API를 **모두 활성화**해야 합니다:

#### **Gmail API 활성화**
1. 검색창에 "Gmail API" 입력
2. Gmail API 클릭
3. "활성화" 버튼 클릭

👉 [Gmail API 링크](https://console.cloud.google.com/apis/library/gmail.googleapis.com)

#### **Google Calendar API 활성화**

👉 [Calendar API 링크](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)

#### **Google Drive API 활성화**

👉 [Drive API 링크](https://console.cloud.google.com/apis/library/drive.googleapis.com)

#### **Google Sheets API 활성화**

👉 [Sheets API 링크](https://console.cloud.google.com/apis/library/sheets.googleapis.com)

---

## OAuth 클라이언트 ID 발급

### 1️⃣ OAuth 동의 화면 설정

1. GCP 콘솔 좌측 메뉴 → **"API 및 서비스"** → **"OAuth 동의 화면"**
2. **User Type: "외부"** 선택
3. "만들기" 클릭

#### 앱 정보 입력
- **앱 이름**: `김비서 대시보드`
- **사용자 지원 이메일**: 본인 이메일
- **개발자 연락처**: 본인 이메일

#### 범위(Scopes) 추가
"범위 추가 또는 제거" 클릭 후 다음을 검색해서 추가:
- `gmail.readonly` (Gmail 읽기)
- `calendar.readonly` (일정 읽기)
- `drive.metadata.readonly` (Drive 파일 정보 읽기)
- `spreadsheets.readonly` (Sheets 읽기)

#### 테스트 사용자 추가
- "테스트 사용자 추가"
- 본인의 Google 이메일 주소 입력

### 2️⃣ OAuth 클라이언트 ID 생성

1. 좌측 메뉴 → **"API 및 서비스"** → **"사용자 인증 정보"**
2. **"사용자 인증 정보 만들기"** → **"OAuth 클라이언트 ID"**
3. 애플리케이션 유형: **"데스크톱 앱"**
4. 이름: `kimbiseo-dashboard-client` (예시)
5. "만들기"

#### 발급된 정보 확인
```
클라이언트 ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
클라이언트 보안 비밀번호: yyyyyyyyyyyyyyyyyyyyyyyy
```

이 정보를 **복사해두세요!**

---

## 환경변수 설정

프로젝트 루트의 `.env.local` 파일을 열어서 다음을 추가하세요:

```env
# Google OAuth 2.0 (발급받은 값으로 교체)
GOOGLE_OAUTH_CLIENT_ID=<위에서 복사한 클라이언트 ID>
GOOGLE_OAUTH_CLIENT_SECRET=<위에서 복사한 클라이언트 보안 비밀번호>

# (선택사항) Google Sheets 데이터 가져오기
# Sheets URL에서 ID 추출: https://docs.google.com/spreadsheets/d/[ID]/edit
# SHEETS_TARGET_ID=<스프레드시트 ID>
```

### 예시:
```env
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsT
```

---

## 인증 및 데이터 가져오기

### 1️⃣ Refresh Token 획득 (한 번만)

터미널에서 실행:

```bash
npm run setup:google
```

**실행 흐름:**
1. 브라우저가 자동으로 열립니다 (Google 로그인 화면)
2. 본인 Google 계정으로 로그인
3. "김비서 대시보드가 다음 권한을 요청합니다" 메시지 나타남
4. "계속" 클릭
5. 터미널에 **"✅ 인증 완료!"** 메시지 표시
6. `.env.local`에 `GOOGLE_OAUTH_REFRESH_TOKEN` 자동 저장

### 2️⃣ 데이터 가져오기

터미널에서 실행:

```bash
npm run fetch:all
```

또는 개별 서비스:

```bash
npm run fetch:gmail      # Gmail 읽지 않은 메일
npm run fetch:calendar   # Calendar 일정
npm run fetch:drive      # Drive 최근 파일
npm run fetch:sheets     # Sheets 데이터
```

**생성되는 파일:**
- `gmail-data.json`
- `calendar-data.json`
- `drive-data.json`
- `sheets-data.json`

### 3️⃣ 대시보드 열기

1. 브라우저에서 `dashboard.html` 또는 `index.html` 열기
2. 4개의 Google 서비스 카드가 표시되어야 합니다
3. 새로고침: `F5` 또는 `Ctrl+R`

---

## 자주 묻는 질문

### Q: "redirect_uri_mismatch" 오류가 나요

**A:** OAuth 클라이언트 ID 설정에서 리디렉션 URI를 확인하세요:

1. GCP 콘솔 → "사용자 인증 정보"
2. 클라이언트 ID 클릭
3. "리디렉션 URI" 섹션에 `http://localhost:53682/oauth2callback` 추가
4. "저장" 클릭

### Q: 데이터가 비어있습니다

**A:** JSON 파일이 없거나 비어있으면 샘플 데이터가 표시됩니다:
- `gmail-data.json` 없음 → "(샘플 데이터)" 뱃지와 함께 표시
- JSON의 `"source": "mock"` → "(샘플 데이터)" 뱃지 표시
- JSON의 `"source": "google-api"` → 실제 데이터 표시

### Q: 특정 서비스만 가져오고 싶습니다

**A:** 개별 스크립트 실행:

```bash
npm run fetch:gmail      # Gmail만
npm run fetch:calendar   # Calendar만
npm run fetch:drive      # Drive만
npm run fetch:sheets     # Sheets만
```

### Q: Google Sheets 데이터를 가져오려면?

**A:** 먼저 스프레드시트 ID를 구하세요:

1. Google Sheets 파일 열기
2. URL: `https://docs.google.com/spreadsheets/d/[ID]/edit`
3. `[ID]` 부분 복사
4. `.env.local`에 추가:
   ```env
   SHEETS_TARGET_ID=<복사한 ID>
   ```
5. `npm run fetch:sheets` 실행

### Q: 인증을 다시 하려면?

**A:** `.env.local`에서 `GOOGLE_OAUTH_REFRESH_TOKEN` 라인을 삭제하고 `npm run setup:google`을 다시 실행하세요.

### Q: 브라우저가 안 열려요

**A:** 수동으로 브라우저를 열고 터미널에 표시된 URL을 복사해서 주소창에 붙여넣으세요.

---

## 🔒 보안 주의사항

⚠️ **중요:**

- `.env.local`은 **절대 공개 저장소에 커밋하지 마세요**
- `.gitignore`에 `.env.local`이 포함되어 있는지 확인하세요
- 클라이언트 ID와 보안 비밀번호는 **공개하지 마세요**
- 토큰이 노출되면 GCP 콘솔에서 즉시 폐기하세요

---

## 💬 문제 해결

**문제:** API가 활성화되지 않았습니다
- **해결:** GCP 콘솔에서 "API 활성화" 버튼을 다시 클릭

**문제:** 권한 오류
- **해결:** OAuth 동의 화면에서 범위(Scopes)를 모두 추가했는지 확인

**문제:** 데이터가 비어있음
- **해결:** `npm run fetch:all`을 다시 실행하세요

---

더 궁금하신 점이 있으면 터미널 메시지를 참고하세요! 😊

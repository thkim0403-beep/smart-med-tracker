# 소셜 로그인(Google, Naver) 설정 가이드

Smart Med Tracker 앱에 구글/네이버 로그인을 활성화하기 위한 설정 가이드입니다.

---

## 📋 사전 준비

소셜 로그인을 사용하려면 각 플랫폼의 개발자 콘솔에서 OAuth 앱을 등록해야 합니다.

---

## 🔵 Google OAuth 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 좌측 메뉴에서 **"APIs & Services"** > **"Credentials"** 클릭
4. **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"** 선택

### 2. OAuth 동의 화면 설정 (처음인 경우)

1. **OAuth consent screen** 탭으로 이동
2. User Type: **External** 선택
3. 앱 정보 입력:
   - App name: `Smart Med Tracker`
   - User support email: 본인 이메일
   - Developer contact: 본인 이메일
4. Scopes 추가: `email`, `profile`, `openid`

### 3. OAuth Client ID 생성

**Web Application 용 (Expo Go 개발용):**
- Application type: **Web application**
- Authorized redirect URIs:
  ```
  https://auth.expo.io/@YOUR_EXPO_USERNAME/med-tracker-v2
  ```

**Android 용 (프로덕션):**
- Application type: **Android**
- Package name: `com.smartmedtracker.app`
- SHA-1 certificate fingerprint: (EAS Build에서 생성)

**iOS 용 (프로덕션):**
- Application type: **iOS**
- Bundle ID: `com.smartmedtracker.app`

### 4. 환경 변수 설정

`.env` 파일에 Client ID 추가:
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

---

## 🟢 Naver OAuth 설정

### 1. 네이버 개발자 센터 설정

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속
2. **"Application"** > **"애플리케이션 등록"** 클릭

### 2. 애플리케이션 정보 입력

- 애플리케이션 이름: `Smart Med Tracker`
- 사용 API: **네이버 로그인** 선택
- 로그인 오픈 API 서비스 환경:
  - **Mobile** 추가
  - 안드로이드 앱 패키지: `com.smartmedtracker.app`
  - iOS Bundle ID: `com.smartmedtracker.app`

### 3. 서비스 URL 설정

- 서비스 URL: `smart-med-tracker://`
- Callback URL: `smart-med-tracker://oauth/naver`

### 4. 환경 변수 설정

`.env` 파일에 Client ID와 Secret 추가:
```env
EXPO_PUBLIC_NAVER_CLIENT_ID=YOUR_NAVER_CLIENT_ID
EXPO_PUBLIC_NAVER_CLIENT_SECRET=YOUR_NAVER_CLIENT_SECRET
```

---

## ⚙️ 앱 설정 확인

### app.json

`app.json`의 scheme이 올바르게 설정되어 있는지 확인:
```json
{
  "expo": {
    "scheme": "smart-med-tracker",
    ...
  }
}
```

### 필요한 패키지 (이미 설치됨)

```bash
npm install expo-auth-session expo-web-browser expo-crypto @react-native-async-storage/async-storage
```

---

## 🧪 테스트

### Expo Go에서 테스트

```bash
npx expo start
```

> ⚠️ **주의**: 네이버 로그인은 Expo Go에서 제한될 수 있습니다. 
> 프로덕션 테스트는 Development Build 또는 EAS Build를 사용하세요.

### Development Build (권장)

```bash
npx expo prebuild
npx expo run:android
```

---

## 🔐 보안 주의사항

1. **절대로** Client Secret을 Git에 커밋하지 마세요
2. `.env` 파일은 `.gitignore`에 추가되어 있어야 합니다
3. 프로덕션에서는 서버 사이드 토큰 교환을 권장합니다

---

## 📱 파일 구조

```
src/
├── services/
│   └── authService.ts      # OAuth 인증 로직
└── store/
    └── authStore.ts        # 인증 상태 관리

app/
├── login.tsx               # 로그인 화면
├── _layout.tsx             # 인증 라우팅
└── (tabs)/
    └── settings.tsx        # 로그아웃 기능
```

---

## 🐛 문제 해결

### "redirect_uri_mismatch" 에러 (Google)
- Google Cloud Console의 Authorized redirect URIs가 정확한지 확인
- Expo username이 올바른지 확인

### 네이버 로그인이 작동하지 않음
- 개발자 센터에서 앱 검수가 완료되었는지 확인
- Callback URL이 정확한지 확인

### 로그인 후 앱으로 돌아오지 않음
- `app.json`의 `scheme`이 올바른지 확인
- WebBrowser warm-up이 호출되었는지 확인

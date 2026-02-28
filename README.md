# Smart Med Tracker

약 봉투를 카메라로 촬영하면 AI가 자동으로 복용 스케줄을 생성해주는 스마트 복약 관리 앱입니다.

## 주요 기능

- **약 봉투 OCR 스캔** - 카메라로 약 봉투를 촬영하면 텍스트를 자동 인식
- **AI 기반 복용 정보 추출** - 인식된 텍스트에서 약 이름, 복용법 등을 자동 파싱
- **맞춤형 복용 알림** - 설정한 시간에 맞춰 푸시 알림 발송
- **일일 복용 체크리스트** - 오늘의 복용 현황을 한눈에 확인
- **복용 달력** - 날짜별 복용 기록 및 진행률 확인
- **소셜 로그인** - Google, 네이버, Apple(iOS) 로그인 지원

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind (TailwindCSS) |
| State | Zustand |
| Database | expo-sqlite (로컬) |
| OCR | @react-native-ml-kit/text-recognition |
| Auth | expo-auth-session, expo-apple-authentication |
| Notifications | expo-notifications |
| Build & Deploy | EAS Build / EAS Submit |

## 프로젝트 구조

```
smart-med-tracker/
├── app/                          # 화면 (Expo Router)
│   ├── _layout.tsx               # 루트 레이아웃
│   ├── login.tsx                 # 로그인 화면
│   └── (tabs)/                   # 탭 네비게이션
│       ├── _layout.tsx           # 탭 레이아웃
│       ├── index.tsx             # 홈 (복용 체크리스트)
│       ├── add.tsx               # 약 추가 (OCR 스캔)
│       └── settings.tsx          # 설정
├── src/
│   ├── components/               # 재사용 컴포넌트
│   │   ├── MedCard.tsx           # 약 카드
│   │   ├── MedForm.tsx           # 약 입력 폼
│   │   ├── MedGroupCard.tsx      # 약 그룹 카드
│   │   ├── ComplianceCalendar.tsx # 복용 달력
│   │   └── ads/                  # 광고 컴포넌트
│   ├── database/                 # SQLite 데이터베이스
│   │   ├── schema.ts             # 테이블 스키마
│   │   └── operations.ts         # CRUD 연산
│   ├── services/                 # 비즈니스 로직
│   │   ├── authService.ts        # 인증 (Google, Naver, Apple)
│   │   ├── notifications.ts      # 푸시 알림
│   │   ├── ocr.ts                # OCR 처리
│   │   └── medicineParser.ts     # 약 정보 파싱
│   └── store/                    # 상태 관리
│       ├── authStore.ts          # 인증 상태
│       └── medStore.ts           # 약 데이터 상태
├── assets/                       # 이미지, 아이콘
├── app.json                      # Expo 설정
├── eas.json                      # EAS Build/Submit 설정
└── package.json
```

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- npm
- Expo Go 앱 (모바일 테스트용) 또는 개발 빌드

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# 플랫폼별 실행
npm run android
npm run ios
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 값을 설정합니다:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
EXPO_PUBLIC_NAVER_CLIENT_SECRET=your_naver_client_secret
```

소셜 로그인 설정에 대한 상세 내용은 [SOCIAL_LOGIN_GUIDE.md](./SOCIAL_LOGIN_GUIDE.md)를 참고하세요.

---

## 배포 현황

### Android (Google Play Store)

| 항목 | 상태 | 비고 |
|------|------|------|
| EAS Build 설정 | ✅ 완료 | development, preview, production 프로필 |
| EAS Submit 설정 | ✅ 완료 | play-store-key.json 연동 |
| AdMob 광고 | ✅ 완료 | 배너, 전면 광고 구현 |
| Preview APK 빌드 | ✅ 완료 | |
| Production AAB 빌드 | ⬜ 미완료 | `eas build -p android --profile production` |
| Play Console 가입 | ⬜ 미완료 | $25 일회성 |
| 스토어 등록 | ⬜ 미완료 | |

상세 가이드: [PLAYSTORE_GUIDE.md](./PLAYSTORE_GUIDE.md), [DEPLOY_ADMOB_GUIDE.md](./DEPLOY_ADMOB_GUIDE.md)

### iOS (Apple App Store)

| 항목 | 상태 | 비고 |
|------|------|------|
| EAS Build 설정 | ✅ 완료 | development(시뮬레이터), preview(TestFlight), production |
| EAS Submit 설정 | ✅ 완료 | ascAppId 플레이스홀더 설정 |
| Sign in with Apple | ✅ 완료 | App Store 필수 요건 (Guidelines 4.8) |
| iOS 권한 설명 한국어화 | ✅ 완료 | 카메라, 사진 라이브러리 |
| app.json iOS 설정 | ✅ 완료 | buildNumber, usesAppleSignIn, infoPlist |
| Apple Developer 가입 | ⬜ 미완료 | $99/년 |
| iOS 빌드 | ⬜ 미완료 | `eas build -p ios --profile production` |
| App Store Connect 설정 | ⬜ 미완료 | 메타데이터, 스크린샷 |
| 심사 제출 | ⬜ 미완료 | |

---

## 다음 단계: iOS App Store 등록

### Step 1. Apple Developer Account 생성

1. https://developer.apple.com 에서 등록
2. Apple ID 필요 (없으면 https://appleid.apple.com 에서 생성)
3. 비용: **$99/년** (개인 기준)
4. 등록 후 승인까지 최대 48시간 소요

### Step 2. EAS CLI 로그인

```bash
npm install -g eas-cli
eas login
```

### Step 3. App Store Connect 앱 ID 설정

`eas.json`의 `submit.production.ios.ascAppId`를 실제 값으로 교체:

```jsonc
// eas.json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "실제_앱_ID_여기에_입력"  // App Store Connect에서 앱 생성 후 확인
    }
  }
}
```

### Step 4. iOS 빌드 (Windows에서 가능)

```bash
# EAS 클라우드에서 빌드 (Mac 불필요)
eas build -p ios --profile production
```

- 첫 빌드 시 EAS가 Apple 인증서/프로비저닝 프로필을 자동 생성
- Apple Developer Account 로그인 필요

### Step 5. TestFlight 테스트 (권장)

```bash
eas submit -p ios --profile production
```

- App Store Connect에 업로드 후 TestFlight에서 내부 테스트 가능

### Step 6. App Store Connect 메타데이터 입력

https://appstoreconnect.apple.com 에서 설정:

| 항목 | 내용 |
|------|------|
| 앱 이름 | Smart Med Tracker - 복약 알리미 |
| 카테고리 | 건강 및 피트니스 또는 의료 |
| 스크린샷 | 6.7인치(iPhone 15 Pro Max), 6.5인치(iPhone 11 Pro Max) 필수 |
| 개인정보처리방침 | https://thkim0403-beep.github.io/smart-med-tracker/ |
| 앱 아이콘 | 1024x1024 (assets/icon.png 활용) |

### Step 7. 심사 제출

- App Store Connect에서 "심사를 위해 제출" 클릭
- 심사 소요: 보통 24~48시간

---

## 다음 단계: Google Play Store 등록

1. Google Play Console 가입 ($25)
2. `eas build -p android --profile production`으로 AAB 빌드
3. 스크린샷 촬영 및 스토어 등록정보 입력
4. 검토 제출

상세 가이드: [PLAYSTORE_GUIDE.md](./PLAYSTORE_GUIDE.md)

---

## 코드 변경 이력 (iOS 대응)

### 수정된 파일

**`eas.json`** - iOS 빌드/제출 프로필 추가
- `build.development.ios`: 시뮬레이터 빌드 (`simulator: true`)
- `build.preview.ios`: TestFlight 내부 배포 (`distribution: "internal"`)
- `build.production.ios`: App Store 배포
- `submit.production.ios`: App Store Connect 제출 설정

**`app.json`** - iOS 설정 보강
- `ios.buildNumber`: "1" (App Store 버전 관리)
- `ios.usesAppleSignIn`: true (Apple 로그인 entitlement)
- `ios.infoPlist`: 카메라/사진 라이브러리 권한 한국어 설명
- plugins에 `expo-apple-authentication` 추가

**`src/services/authService.ts`** - Apple 로그인 서비스 추가
- `signInWithApple()` 함수 구현
- iOS 플랫폼 체크, Apple 로그인 가용성 체크
- 첫 로그인 시에만 이름/이메일 제공되는 Apple 특성 처리
- `UserInfo.provider` 타입에 `"apple"` 추가

**`src/store/authStore.ts`** - Apple 로그인 상태 관리 추가
- `signInWithApple` 액션 추가

**`app/login.tsx`** - Apple 로그인 버튼 추가
- iOS에서만 표시되는 검정 Apple 로그인 버튼
- Apple Human Interface Guidelines 준수 (검정 배경, 흰색 텍스트)

### 추가된 패키지

- `expo-apple-authentication` - Sign in with Apple 구현

---

## 참고 가이드

| 문서 | 내용 |
|------|------|
| [PLAYSTORE_GUIDE.md](./PLAYSTORE_GUIDE.md) | Google Play Store 등록 상세 가이드 |
| [DEPLOY_ADMOB_GUIDE.md](./DEPLOY_ADMOB_GUIDE.md) | Android 배포 및 AdMob 광고 가이드 |
| [SOCIAL_LOGIN_GUIDE.md](./SOCIAL_LOGIN_GUIDE.md) | Google, Naver 소셜 로그인 설정 가이드 |

## 개인정보처리방침

https://thkim0403-beep.github.io/smart-med-tracker/

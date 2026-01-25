# 📱 Smart Med Tracker - 안드로이드 배포 & AdMob 광고 통합 가이드

## 목차
1. [AdMob 패키지 설치](#1-admob-패키지-설치)
2. [AdMob 계정 설정](#2-admob-계정-설정)
3. [app.json 설정 업데이트](#3-appjson-설정-업데이트)
4. [광고 컴포넌트 사용법](#4-광고-컴포넌트-사용법)
5. [Play Store 배포](#5-play-store-배포)

---

## 1. AdMob 패키지 설치

```bash
npx expo install react-native-google-mobile-ads
```

> ⚠️ **중요**: 이 패키지는 Expo Go에서 작동하지 않습니다. EAS Build로 빌드한 앱에서만 테스트 가능합니다.

---

## 2. AdMob 계정 설정

### 2.1 AdMob 가입
1. [Google AdMob](https://admob.google.com/) 방문
2. Google 계정으로 로그인
3. 계정 설정 완료

### 2.2 앱 등록
1. **앱** → **앱 추가** 클릭
2. 플랫폼: **Android** 선택
3. 앱 이름: `Smart Med Tracker`
4. **앱 ID** 복사 (예: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`)

### 2.3 광고 단위 생성

| 광고 유형 | 용도 | 권장 위치 |
|----------|------|----------|
| **배너** | 화면 상단/하단에 고정 | 홈 화면 하단 |
| **전면 광고** | 화면 전환 시 표시 | 약 추가 완료 후 |
| **리워드** | 보상형 광고 | 프리미엄 기능 해제 |

각 광고 단위 생성 후 **광고 단위 ID** 복사

---

## 3. app.json 설정 업데이트

`app.json`의 AdMob 플러그인에서 앱 ID를 실제 값으로 교체:

```json
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-실제앱ID~실제앱ID",
    "iosAppId": "ca-app-pub-실제앱ID~실제앱ID"
  }
]
```

---

## 4. 광고 컴포넌트 사용법

### 4.1 배너 광고

```tsx
import { BannerAdComponent } from '../src/components/ads';

// 화면 하단에 배너 광고 표시
<BannerAdComponent />
```

### 4.2 전면 광고

```tsx
import { 
  loadInterstitialAd, 
  showInterstitialAd 
} from '../src/components/ads';

// 앱 시작 시 광고 미리 로드
useEffect(() => {
  loadInterstitialAd();
}, []);

// 특정 액션 후 광고 표시
const handleComplete = async () => {
  await showInterstitialAd();
  // 다음 화면으로 이동
};
```

### 4.3 광고 단위 ID 설정

`src/components/ads/BannerAdComponent.tsx`와 `InterstitialAdManager.tsx`에서:

```tsx
// 개발 중에는 테스트 ID 사용 (자동)
// 배포 시 아래 값을 실제 ID로 교체
android: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_UNIT_ID',
ios: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_IOS_UNIT_ID',
```

---

## 5. Play Store 배포

### 5.1 빌드 명령어

```bash
# 테스트용 APK
eas build -p android --profile preview

# Play Store 배포용 AAB
eas build -p android --profile production
```

### 5.2 Play Console 업로드
1. [Google Play Console](https://play.google.com/console) 접속
2. **앱 만들기** → 앱 정보 입력
3. **프로덕션** → **새 버전 만들기**
4. AAB 파일 업로드
5. 필수 정보 입력:
   - 스크린샷 (최소 2장)
   - 앱 설명 (한국어)
   - 개인정보 처리방침 URL
   - 연령 등급

### 5.3 광고 관련 필수 사항

| 항목 | 설명 |
|------|------|
| **개인정보 처리방침** | 광고 SDK 사용 시 필수 |
| **app-ads.txt** | 웹사이트에 호스팅 필요 (AdMob에서 제공) |
| **GDPR 동의** | EU 사용자 대상 시 필수 |

---

## 🚨 주의사항

1. **테스트 광고 ID 사용**
   - 개발 중에는 반드시 테스트 ID 사용
   - 실제 ID로 테스트 클릭 시 계정 정지 위험

2. **광고 정책 준수**
   - 자체 클릭 금지
   - 광고 클릭 유도 금지
   - 콘텐츠 정책 준수

3. **EAS Build 필수**
   - AdMob은 네이티브 모듈이므로 Expo Go에서 작동 안 함
   - 반드시 EAS Build로 테스트

---

## 📁 생성된 파일 목록

```
src/components/ads/
├── BannerAdComponent.tsx    # 배너 광고 컴포넌트
├── InterstitialAdManager.tsx # 전면 광고 관리자
└── index.ts                  # 내보내기
```

---

## 다음 단계

1. ✅ AdMob 계정 생성
2. ✅ 앱 등록 및 광고 단위 ID 발급
3. ✅ `npx expo install react-native-google-mobile-ads` 실행
4. ✅ app.json에 실제 앱 ID 입력
5. ✅ 광고 컴포넌트 ID 업데이트
6. ✅ EAS Build로 테스트
7. ✅ Play Store 배포

import { Platform } from 'react-native';
import {
    InterstitialAd,
    AdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

// 전면 광고 단위 ID 설정
// ⚠️ 프로덕션 배포 전에 실제 광고 단위 ID로 교체하세요!
const INTERSTITIAL_AD_UNIT_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        android: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_INTERSTITIAL_UNIT_ID',
        ios: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_IOS_INTERSTITIAL_ID',
        default: TestIds.INTERSTITIAL,
    }) ?? TestIds.INTERSTITIAL;

// 싱글톤 전면 광고 인스턴스
let interstitialAd: InterstitialAd | null = null;
let isAdLoaded = false;
let isAdLoading = false;

/**
 * 전면 광고 초기화 및 로드
 * 앱 시작 시 또는 광고 표시 후 다음 광고를 미리 로드할 때 호출
 */
export function loadInterstitialAd(): void {
    if (isAdLoading || isAdLoaded) {
        return;
    }

    isAdLoading = true;

    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
    });

    // 광고 로드 완료 이벤트
    const unsubscribeLoaded = interstitialAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
            isAdLoaded = true;
            isAdLoading = false;
            console.log('Interstitial ad loaded');
        }
    );

    // 광고 닫힘 이벤트 - 다음 광고 미리 로드
    const unsubscribeClosed = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
            isAdLoaded = false;
            // 다음 광고 미리 로드
            setTimeout(() => loadInterstitialAd(), 1000);
        }
    );

    // 광고 로드
    interstitialAd.load();
}

/**
 * 전면 광고 표시
 * @returns Promise<boolean> - 광고 표시 성공 여부
 */
export async function showInterstitialAd(): Promise<boolean> {
    if (!isAdLoaded || !interstitialAd) {
        console.log('Interstitial ad not ready');
        // 광고가 준비되지 않았으면 로드 시작
        loadInterstitialAd();
        return false;
    }

    try {
        await interstitialAd.show();
        isAdLoaded = false;
        return true;
    } catch (error) {
        console.log('Failed to show interstitial ad:', error);
        return false;
    }
}

/**
 * 전면 광고 표시 조건 체크
 * 예: 3번에 1번만 광고 표시
 */
let actionCount = 0;
const AD_FREQUENCY = 3; // 3번 액션마다 1번 광고

export async function showInterstitialAdWithFrequency(): Promise<boolean> {
    actionCount++;

    if (actionCount >= AD_FREQUENCY) {
        actionCount = 0;
        return showInterstitialAd();
    }

    return false;
}

/**
 * 광고 준비 상태 확인
 */
export function isInterstitialAdReady(): boolean {
    return isAdLoaded;
}

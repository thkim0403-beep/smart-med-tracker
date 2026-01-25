import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
    BannerAd,
    BannerAdSize,
    TestIds,
} from 'react-native-google-mobile-ads';

// 광고 단위 ID 설정
// ⚠️ 프로덕션 배포 전에 실제 광고 단위 ID로 교체하세요!
const BANNER_AD_UNIT_ID = __DEV__
    ? TestIds.BANNER // 개발 중에는 테스트 ID 사용
    : Platform.select({
        android: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_BANNER_UNIT_ID', // 실제 Android 배너 ID
        ios: 'ca-app-pub-YOUR_ADMOB_ID/YOUR_IOS_BANNER_ID', // 실제 iOS 배너 ID
        default: TestIds.BANNER,
    }) ?? TestIds.BANNER;

interface BannerAdComponentProps {
    size?: BannerAdSize;
    containerStyle?: object;
}

export default function BannerAdComponent({
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    containerStyle,
}: BannerAdComponentProps) {
    const [adError, setAdError] = useState(false);

    if (adError) {
        // 광고 로드 실패 시 빈 공간 표시 (또는 대체 콘텐츠)
        return null;
    }

    return (
        <View style={[styles.container, containerStyle]}>
            <BannerAd
                unitId={BANNER_AD_UNIT_ID}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true, // GDPR 준수
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded');
                }}
                onAdFailedToLoad={(error) => {
                    console.log('Banner ad failed to load:', error);
                    setAdError(true);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
});

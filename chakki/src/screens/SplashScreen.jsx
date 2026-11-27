
import React, { useEffect, useRef } from 'react';
import {
    View,
    Image,
    Text,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    TouchableWithoutFeedback,
    useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BrandLogo } from './ui';
import { colors, spacing } from './theme';

const SOFTEL_LOGO = require('../assets/images/Softel Millet mill logo 2.png');
const RASOI_LOGO = require('../assets/images/capture12.png');

const AUTO_ADVANCE_MS = 3000;

const SplashScreen = ({ navigation }) => {
    const hasNavigated = useRef(false);

    const { width } = useWindowDimensions();

    const taglineFontSize = Math.round(
        Math.min(Math.max(width * 0.085, 24), 36)
    );

    const goNext = async () => {
        if (!navigation || hasNavigated.current) return;

        hasNavigated.current = true;

        try {
            const autoLogin = await AsyncStorage.getItem('auto_login');
            const customerId = await AsyncStorage.getItem('customer_id');

            if (autoLogin === 'true' && customerId) {
                navigation.replace('Main', {
                    customer_id: Number(customerId),
                });
                return;
            }
        } catch (error) {
            console.log('AUTO LOGIN CHECK ERROR:', error);
        }

        if (typeof navigation.replace === 'function') {
            navigation.replace('Login');
        } else if (typeof navigation.navigate === 'function') {
            navigation.navigate('Login');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            goNext();
        }, AUTO_ADVANCE_MS);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <TouchableWithoutFeedback onPress={goNext}>
            <View style={styles.container}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={colors.surface}
                />

                {/* Logo Section */}
                <SafeAreaView
                    style={styles.topSection}
                    edges={['top', 'left', 'right']}
                >
                    <Image
                        source={SOFTEL_LOGO}
                        style={styles.millLogo}
                        resizeMode="contain"
                    />

                    <Text style={styles.byText}>by</Text>

                    <View style={styles.rasoiLogoWrap}>
                        <BrandLogo
                            source={RASOI_LOGO}
                            ratio={320 / 60}
                            variant="splash"
                        />
                    </View>
                </SafeAreaView>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.content}>
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={[
                                styles.tagline,
                                { fontSize: taglineFontSize },
                            ]}
                        >
                            Welcome back
                        </Text>

                        <ActivityIndicator
                            size="large"
                            color={colors.textOnPrimary}
                            style={styles.loader}
                        />
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },

    topSection: {
        flex: 1,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },

    millLogo: {
        width: 245,
        height: 92,
        marginBottom: 10,
    },

    byText: {
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '400',
        color: '#666666',
        marginVertical: 3,
        letterSpacing: 0.4,
    },

    rasoiLogoWrap: {
        transform: [{ scale: 0.9 }],
    },

    bottomSection: {
        flex: 1,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    content: {
        flex: 1,
        width: '92%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    tagline: {
        fontWeight: '700',
        color: '#E0D6E8',
        textAlign: 'center',
        marginTop: spacing.sm,
    },

    loader: {
        marginTop: spacing.huge,
    },
});

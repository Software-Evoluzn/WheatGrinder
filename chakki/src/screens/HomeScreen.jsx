import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../services/theme';
import { colors, spacing, radii, typography, shadows, layout } from './theme';
import { MainHeader, Eyebrow, StatusBadge, PrimaryButton } from './ui';

const HomeScreen = ({ navigation }) => {
    // Kept for status-bar theming / dark-mode contract. Visual system now comes
    // from the shared design tokens so Home matches the rest of the app.
    const { isDark } = useAppTheme();

    const handleProfile = () => {
        if (navigation?.navigate) navigation.navigate('EditProfile');
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Shared primary-screen header: greeting + identity + profile action.
                Profile action opens the Edit Profile screen. */}
            <MainHeader
                greeting="Welcome back"
                title="KITCHEN UTENSILS"
                actionIcon="user"
                onAction={handleProfile}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Brand banner */}
                <View style={styles.bannerCard}>
                    <Image
                        source={require('../assets/images/capture.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.tagline}>Smart Home Automation Products</Text>
                </View>

                {/* Featured device */}
                <View style={styles.cardWrapper}>
                    <View style={styles.toolCard}>
                        <View style={styles.imageFrame}>
                            <Image
                                source={require('../assets/images/grinder.png')}
                                style={styles.toolImage}
                                resizeMode="cover"
                            />
                            <View style={styles.badgeFloat}>
                                <StatusBadge label="Ready" variant="success" icon="check-circle" />
                            </View>
                        </View>

                        <View style={styles.toolBody}>
                            <Eyebrow>Smart Appliance</Eyebrow>
                            <Text style={styles.toolTitle}>Grinding Machine</Text>
                            <Text style={styles.toolDescription}>
                                High performance grinding for your kitchen
                            </Text>

                            <PrimaryButton
                                title="START"
                                icon="arrow-right"
                                onPress={() => navigation.navigate('CollectionCloth')}
                                style={{ marginTop: spacing.xl }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: layout.screenPaddingHorizontal,
        paddingBottom: spacing.huge,
    },

    bannerCard: {
        alignItems: 'center',
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    logoImage: {
        width: 180,
        height: 48,
        marginBottom: spacing.sm,
    },
    tagline: {
        ...typography.caption,
        color: colors.textMuted,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    cardWrapper: {
        width: '100%',
    },
    toolCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.card,
    },
    imageFrame: {
        width: '100%',
        height: 210,
        backgroundColor: colors.primaryTint,
    },
    toolImage: {
        width: '100%',
        height: '100%',
    },
    badgeFloat: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.lg,
    },
    toolBody: {
        padding: spacing.xxl,
    },
    toolTitle: {
        ...typography.title,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    toolDescription: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});
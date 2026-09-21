import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../services/theme';
import { colors, spacing, radii, typography, shadows, layout } from './theme';
import { MainHeader, Eyebrow, StatusBadge, PrimaryButton } from './ui';
import IP_CONFIG from '../services/ip.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = IP_CONFIG.BASE_URL; // Apne backend ka IP add karein

const HomeScreen = ({ navigation, route }) => {
    const { isDark } = useAppTheme();
    
    // Default/Logged-in Customer ID (Pass via auth or route params)
   

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUserDevices = async () => {
        try {
            setLoading(true);
            let customerId = route?.params?.customer_id;

            if(!customerId){
                customerId = await AsyncStorage.getItem('customer_id')
            }


           console.log("Fetching fr customer id:" , customerId)
            const response = await fetch(`${API_BASE_URL}/customer-products/${customerId}`);
            const data = await response.json();
            console.log(data)
            if (response.ok) {
                setDevices(data.devices || []);
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserDevices();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserDevices();
    };

    const renderDeviceItem = ({ item }) => {
        const isReady = item.is_active;

        return (
            <View style={styles.cardWrapper}>
                <View style={styles.toolCard}>
                    {/* Header Image Frame */}
                    <View style={styles.imageFrame}>
                        <Image
                            source={require('../assets/images/grinder.png')}
                            style={styles.toolImage}
                            resizeMode="cover"
                        />
                        <View style={styles.badgeFloat}>
                            <StatusBadge
                                label={isReady ? "Warranty Active" : "Expired"}
                                variant={isReady ? "success" : "danger"}
                                icon={isReady ? "check-circle" : "alert-circle"}
                            />
                        </View>
                    </View>

                    {/* Card Content Body */}
                    <View style={styles.toolBody}>
                        <Eyebrow>{item.model_number}</Eyebrow>
                        <Text style={styles.toolTitle}>{item.product_name}</Text>

                        {/* Professional Meta Details */}
                        <View style={styles.metaContainer}>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>DEVICE ID / SN:</Text>
                                <Text style={styles.metaValue}>{item.serial_number}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>MAC ADDRESS:</Text>
                                <Text style={styles.metaValue}>{item.mac_id}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>WARRANTY TILL:</Text>
                                <Text style={styles.metaValue}>{item.warranty_expiry}</Text>
                            </View>
                        </View>

                        <PrimaryButton
                            title="CONTROL DEVICE"
                            icon="arrow-right"
                            onPress={() => navigation.navigate('CollectionCloth', { device: item })}
                            style={{ marginTop: spacing.lg }}
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <MainHeader
                greeting="Welcome back"
                title="MY DEVICES"
                actionIcon="user"
                onAction={() => navigation?.navigate('EditProfile')}
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderDeviceItem}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListHeaderComponent={
                        <View style={styles.bannerCard}>
                            <Image
                                source={require('../assets/images/capture.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.tagline}>Smart Home Automation Products</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No registered devices found.</Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: layout.screenPaddingHorizontal,
        paddingBottom: spacing.huge,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerCard: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    logoImage: {
        width: 180,
        height: 48,
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.caption,
        color: colors.textMuted,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    cardWrapper: {
        width: '100%',
        marginBottom: spacing.xl,
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
        height: 180,
        backgroundColor: colors.primaryTint,
    },
    toolImage: {
        width: '100%',
        height: '100%',
    },
    badgeFloat: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
    },
    toolBody: {
        padding: spacing.xl,
    },
    toolTitle: {
        ...typography.title,
        color: colors.textPrimary,
        marginTop: spacing.xs,
        fontSize: 20,
        fontWeight: '700',
    },
    metaContainer: {
        backgroundColor: colors.background,
        borderRadius: radii.md,
        padding: spacing.md,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    metaLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.5,
    },
    metaValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptyContainer: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
});
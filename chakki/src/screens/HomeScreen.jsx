import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../services/theme';

const HomeScreen = ({ navigation }) => {
    const { colors, isDark } = useAppTheme();
    const styles = createStyles(colors);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="#FFFFFF"
            />

            {/* Top Navigation Bar */}
            <View style={styles.headerBar}>
               

                <Text style={styles.headerTitle}>My Kitchen Tools</Text>

                <TouchableOpacity style={styles.avatarCircle}>
                    <Feather name="user" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.mainContainer}>
                    {/* Banner / Logo Section */}
                    <View style={styles.bannerCard}>
                        <Image
                            source={require('../assets/images/capture.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.tagline}>
                            Smart Home Automation Products
                        </Text>
                    </View>

                    {/* Centered Grinding Machine Card */}
                    <View style={styles.cardWrapper}>
                        <View style={styles.toolCard}>
                            {/* FIXED: Directly pass static image without { uri: ... } */}
                            <Image
                                source={require('../assets/images/grinder.png')}
                                style={styles.toolImage}
                                resizeMode="cover"
                            />

                            <Text style={styles.toolTitle}>GRINDING MACHINE</Text>

                            <Text style={styles.toolDescription}>
                                High Performance Grinding for your kitchen
                            </Text>

                            <TouchableOpacity
                                style={styles.startButton}
                                activeOpacity={0.85}
                               onPress={() => navigation.navigate('SelfCleaning')} // 👈 Navigate here
                            >
                                <Text style={styles.startButtonText}>START</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Footer */}
              
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;

const createStyles = (colors) =>
    StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: '#FFFFFF',
        },

        /* Top Navigation Header */
        headerBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: '#FFFFFF',
        },

        iconBtn: {
            padding: 4,
        },

        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: '#3E1A5B',
        },

        avatarCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#3E1A5B',
            justifyContent: 'center',
            alignItems: 'center',
        },

        /* Scroll Container */
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingBottom: 20,
            backgroundColor: '#FAFAFD',
        },

        mainContainer: {
            alignItems: 'center',
            width: '100%',
        },

        /* Banner Logo Section */
        bannerCard: {
            alignItems: 'center',
            paddingTop: 20,
            paddingBottom: 16,
            width: '100%',
        },

        logoImage: {
            width: 180,
            height: 48,
            marginBottom: 4,
        },

        tagline: {
            fontSize: 11,
            color: '#8E8E93',
            fontWeight: '500',
        },

        /* Centered Vertical Card */
        cardWrapper: {
            width: '100%',
            paddingHorizontal: 36,
            marginTop: 8,
        },

        toolCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 20, // 👈 Padding zaroori hai taaki image card ki edges se touch na ho
            alignItems: 'center',

            // Shadow styling
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#F0F0F3',
        },

        toolImage: {
            width: '100%',
            height: 190, // 👈 Fixed height (Aap isko 160, 180, 200 karke adjust kar sakte hain)
            borderRadius: 16,
            marginBottom: 16,
            backgroundColor: 'transparent', // 👈 Heavy gray background hata diya gaya hai
        },
        toolTitle: {
            fontSize: 14,
            fontWeight: '800',
            color: '#1C1C1E',
            letterSpacing: 0.5,
            textAlign: 'center',
        },

        toolDescription: {
            fontSize: 11,
            color: '#8E8E93',
            marginTop: 4,
            marginBottom: 16,
            textAlign: 'center',
        },

        startButton: {
            backgroundColor: '#522D70',
            paddingVertical: 10,
            paddingHorizontal: 44,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },

        startButtonText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.8,
        },

        /* Footer */
        footerText: {
            textAlign: 'center',
            fontSize: 10,
            fontWeight: '500',
            color: '#A0A0A5',
            marginTop: 20,
            marginBottom: 10,
        },
    });
import React, { useState } from 'react';
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

const GRAINS = [
    { id: 'wheat', label: 'WHEAT', image: require('../assets/images/wheat.png') },
    { id: 'chana_dal', label: 'CHANA DAL', image: require('../assets/images/chana_dal.png') },
    { id: 'rice', label: 'RICE', image: require('../assets/images/rice.png') },
    { id: 'ragi', label: 'RAGI', image: require('../assets/images/ragi.png') },
    { id: 'fada', label: 'SPLITS (FADA)', image: require('../assets/images/splits.png') },
    { id: 'jowar', label: 'JOWAR', image: require('../assets/images/jowar.png') },
    { id: 'bajra', label: 'BAJRA', image: require('../assets/images/bajra.png') },
    { id: 'masala', label: 'MASALA', image: require('../assets/images/masala.png') },
    { id: 'others', label: 'OTHERS', isOthers: true },
];

const SelectGrainScreen = ({ navigation }) => {
    const [selectedGrain, setSelectedGrain] = useState('ragi');

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Top Bar */}
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
                    {/* Brand Logo Banner */}
                    <View style={styles.bannerContainer}>
                        <Image
                            source={require('../assets/images/capture.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.tagline}>
                            Smart Home Automation Products
                        </Text>
                    </View>

                    {/* Section Heading */}
                    <Text style={styles.sectionTitle}>SELECT GRAIN</Text>

                    {/* 3x3 Grid Container */}
                    <View style={styles.gridContainer}>
                        {GRAINS.map((item) => {
                            const isSelected = selectedGrain === item.id;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedGrain(item.id)}
                                    style={[
                                        styles.grainCard,
                                        isSelected && styles.selectedCard,
                                    ]}
                                >
                                    {item.isOthers ? (
                                        <View style={styles.othersIconCircle}>
                                            <Feather name="more-horizontal" size={20} color="#00A896" />
                                        </View>
                                    ) : (
                                        <Image
                                            source={item.image}
                                            style={styles.grainImage}
                                            resizeMode="contain"
                                        />
                                    )}

                                    <Text
                                        style={[
                                            styles.grainLabel,
                                            isSelected && styles.selectedGrainLabel,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
                            <Text style={styles.actionBtnText}>CLEAN STONE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('GrainConfirmationScreen', { grainId: selectedGrain })}
                        >
                            <Text style={styles.actionBtnText}>NEXT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footerText}>Powered by EVOLUZN</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SelectGrainScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    /* Header */
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

    /* Scroll Body */
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: 20,
        backgroundColor: '#FAFAFD',
    },

    mainContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    /* Logo Banner */
    bannerContainer: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
    },

    logoImage: {
        width: 170,
        height: 44,
        marginBottom: 4,
    },

    tagline: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#333333',
        letterSpacing: 0.8,
        marginVertical: 12,
    },

    /* Grid Layout */
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        rowGap: 14,
    },

    grainCard: {
        width: '31%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#EFEFEF',

        // Soft Shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },

    selectedCard: {
        borderColor: '#522D70',
        borderWidth: 2,
    },

    grainImage: {
        width: 52,
        height: 48,
        marginBottom: 8,
    },

    othersIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#00A896',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    grainLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#444444',
        textAlign: 'center',
        letterSpacing: 0.2,
    },

    selectedGrainLabel: {
        color: '#522D70',
    },

    /* Action Buttons */
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
        marginTop: 24,
    },

    actionBtn: {
        flex: 1,
        backgroundColor: '#522D70',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.6,
    },

    /* Footer */
    footerText: {
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '500',
        color: '#A0A0A5',
        marginTop: 20,
    },
});
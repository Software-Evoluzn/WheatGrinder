
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

const GrinderSetupFlowScreen = ({ navigation }) => {

  const handleNext = () => {
    navigation.navigate('GrindSetting');
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Grinder Setup
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          NEXT
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default GrinderSetupFlowScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    color: '#333333',
  },

  button: {
    width: 180,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#55327A',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});


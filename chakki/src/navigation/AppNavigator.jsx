import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomNavigator from '../screens/BottomTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import SelectGrainScreen from '../screens/SelectGrainScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SelfCleaning from '../screens/SelfCleaningScreen';
import ResumeGrindingScreen from '../screens/ResumeGrindingScreen';
import CollectionCloth from '../screens/CollectionClothScreen';
import ConnectWifiScreen from '../screens/ConnectWifiScreen';
import CleaningProcessScreen from '../screens/CleaningProcessScreen';
import ReadyToInitiateSelfCleaning from '../screens/ReadyToInitiateSelfCleaning';
import CleanStoneChoiceScreen from '../screens/CleanStoneChoiceScreen';
import UserChoiceScreen from '../screens/UserChoiceScreen';
import SetGrindTexture from '../screens/SetGrindTexture';
import SetFlowRate from '../screens/SetFlowRate';
import LoadGrainToStart from '../screens/LoadGrainsToStart';
import GrainOverScreen from '../screens/GrainOverScreen';
import MachineOverload from '../screens/MachineOverloadScreen';
import WaitScreen from '../screens/WaitScreen';
import PauseScreen from '../screens/PauseScreen';
import HighTemperatureScreen from '../screens/HighTemperatureScreen';
import RemoveMaterialFromHopperScreen from '../screens/RemoveMaterialFromHopperScreen';
import GrainConfirmationScreen from '../screens/GrainConfirmationScreen';
import MillingControlScreen from '../screens/MillingControlScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { StackActions } from '@react-navigation/native';




const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName='Splash'
      screenOptions={
        {
          headerShown: false,
        }}>

      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name='WelomeScreen' component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={BottomNavigator} />
      <Stack.Screen name='SelfCleaning' component={SelfCleaning} />
      <Stack.Screen name='ResumeGrinding' component={ResumeGrindingScreen} />
      <Stack.Screen name='CollectionCloth' component={CollectionCloth} />
      <Stack.Screen name='ReadyToInitiateSelfCleaning' component={ReadyToInitiateSelfCleaning} />
      <Stack.Screen name='ConnectWifiScreen' component={ConnectWifiScreen} />
      <Stack.Screen name='CleaningProcessScreen' component={CleaningProcessScreen} />
      <Stack.Screen name='CleanStoneChoiceScreen' component={CleanStoneChoiceScreen} />
      <Stack.Screen name="SelectGrain" component={SelectGrainScreen} />
      <Stack.Screen name='GrainConfirmationScreen' component={GrainConfirmationScreen} />
      <Stack.Screen name='EditProfile' component={EditProfileScreen} />
      <Stack.Screen name='UserChoiceScreen' component={UserChoiceScreen} />
      <Stack.Screen name='SetFlowRate' component={SetFlowRate} />
      <Stack.Screen name='SetGrindTexture' component={SetGrindTexture} />
      <Stack.Screen name='MillingControlScreen' component={MillingControlScreen} />
      <Stack.Screen name='LoadGrainToStart' component={LoadGrainToStart} />
      <Stack.Screen name='GrainOverScreen' component={GrainOverScreen} />
      <Stack.Screen name='MachineOverload' component={MachineOverload} />
      <Stack.Screen name='WaitScreen' component={WaitScreen} />
      <Stack.Screen name='PauseScreen' component={PauseScreen} />
      <Stack.Screen name='HighTemperatureScreen' component={HighTemperatureScreen} />
      <Stack.Screen name='RemoveMaterialFromHopperScreen' component={RemoveMaterialFromHopperScreen} />
      <Stack.Screen name='VerifyOtpScreen' component={VerifyOtpScreen}/>
      <Stack.Screen name='ForgotPasswordScreen' component={ForgotPasswordScreen}/>
      <Stack.Screen name='ResetPasswordScreen' component={ResetPasswordScreen}/>

    </Stack.Navigator>
  )
}

export default AppNavigator

const styles = StyleSheet.create({})
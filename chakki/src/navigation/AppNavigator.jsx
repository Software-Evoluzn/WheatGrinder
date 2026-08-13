import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductRegistrationScreen from '../screens/ProductRegistrationScreen';
import BottomNavigator from '../screens/BottomTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';

import SelectGrainScreen from '../screens/SelectGrainScreen';
import GrindingSettingScreen from '../screens/GrindSettingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
     <Stack.Navigator
     initialRouteName='Splash'
     screenOptions={
               {headerShown: false,
               }}>

                <Stack.Screen name="Splash" component={SplashScreen}/>
                <Stack.Screen name="Login" component={LoginScreen}/>
                <Stack.Screen name="Register" component={RegisterScreen}/>
                <Stack.Screen name="Main" component={BottomNavigator}/>
                <Stack.Screen name="SelectGrain" component={SelectGrainScreen}/>
                <Stack.Screen name='GrindSetting' component={GrindingSettingScreen}/>
                <Stack.Screen name='EditProfile' component={EditProfileScreen}/>
                {/* <Stack.Screen name="Home" component={HomeScreen}/>
                <Stack.Screen name="ProductRegister" component={ProductRegistrationScreen}/>
                <Stack.Screen name="SettingsScreen" component={SettingScreen}/> */}

     </Stack.Navigator>
  )
}

export default AppNavigator

const styles = StyleSheet.create({})
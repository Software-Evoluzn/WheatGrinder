import { StyleSheet, Text, View } from 'react-native'
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';


const App = () => {
   console.log("hello");
   return (
      <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})
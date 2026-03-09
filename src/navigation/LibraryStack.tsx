// navigation/LibraryStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LearnScreen from "../screens/LearnScreen";
import NameDetailScreen from "../screens/NameDetailScreen";

const Stack = createNativeStackNavigator();

export default function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnMain" component={LearnScreen} />
      <Stack.Screen name="NameDetailScreen" component={NameDetailScreen} />
    </Stack.Navigator>
  );
}
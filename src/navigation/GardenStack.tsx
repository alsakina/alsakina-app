// navigation/GardenStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExploreScreen from "../screens/ExploreScreen";
import DailyContentScreen from "../screens/DailyContentScreen";

const Stack = createNativeStackNavigator();

export default function GardenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GardenMain" component={ExploreScreen} />
      <Stack.Screen name="DailyContentScreen" component={DailyContentScreen} />
    </Stack.Navigator>
  );
}
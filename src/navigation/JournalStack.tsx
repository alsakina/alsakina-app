// navigation/JournalStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import JournalScreen from "../screens/JournalScreen";
import JournalEntryScreen from "../screens/JournalEntryScreen";

const Stack = createNativeStackNavigator();

export default function JournalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JournalMain" component={JournalScreen} />
      <Stack.Screen name="JournalEntryScreen" component={JournalEntryScreen} />
    </Stack.Navigator>
  );
}
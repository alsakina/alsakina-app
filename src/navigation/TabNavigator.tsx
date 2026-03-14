// navigation/TabNavigator.tsx
import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Heart,
  BookOpen,
  Circle,
  NotebookPen,
  Sprout,
} from "lucide-react-native";

import DhikrScreen from "../screens/DhikrScreen";
import LibraryStack from "./LibraryStack";
import HomeScreen from "../screens/HomeScreen";
import JournalStack from "./JournalStack";
import GardenStack from "./GardenStack";
import { Colors } from "../lib/theme";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.sage,
        tabBarInactiveTintColor: Colors.charcoalMuted,
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: "rgba(135,169,107,0.12)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Dhikr"
        component={DhikrScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Circle size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sanctuary"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Heart size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <NotebookPen size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Garden"
        component={GardenStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Sprout size={size - 2} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
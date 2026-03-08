# Al-Sakina — Setup Guide (Windows)

## Step 1: Delete old project & start fresh

```powershell
cd C:\Users\emara
Remove-Item -Recurse -Force al-sakina-temp
npx create-expo-app@latest al-sakina --template blank-typescript
cd al-sakina
```

## Step 2: Remove "type": "module" from package.json

This is CRITICAL for Windows. Run:

```powershell
npm pkg delete type
```

Verify it's gone:

```powershell
node -e "const p=require('./package.json'); console.log(p.type ?? 'GOOD - no type field')"
```

## Step 3: Install dependencies

```powershell
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage nativewind react-native-reanimated lucide-react-native react-native-svg expo-linear-gradient

npm install -D tailwindcss@^3.4.17
```

## Step 4: Copy files from this zip

Copy and OVERWRITE into your project root:
- app.json
- App.tsx
- babel.config.js
- metro.config.js
- tailwind.config.js
- global.css
- nativewind-env.d.ts
- assets/ (entire folder, overwrite existing)
- src/ (entire folder)

## Step 5: Run

```powershell
npx expo start -c
```

Scan the QR code with Expo Go on your phone.

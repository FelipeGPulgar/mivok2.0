# Mivok AI Coding Instructions

## Project Overview

**Mivok** is a React Native/Expo mobile application that connects DJs with event clients. The app supports multi-platform deployment (iOS, Android, Web) using Expo Router for navigation and Supabase for backend services with Google/Microsoft/Facebook OAuth authentication.

**Key Tech Stack:**
- Frontend: React Native 0.81.4, Expo 54, React 19.1.0
- Navigation: Expo Router 6.0.4 (file-based routing)
- State: AsyncStorage for client-side persistence
- Backend: Supabase (PostgreSQL + Auth)
- Auth: OAuth (Google, Microsoft, Facebook) via Supabase
- UI Framework: react-native-svg, expo-linear-gradient, expo-icons

## Architecture & Data Flow

### Screen Structure (`app/` directory)
The app uses **Expo Router file-based routing**. Key screens:
- `_layout.tsx` - Main Tab layout (hidden tab bar, custom navigation)
- `index.tsx` - Welcome/Splash screen with OAuth flows (770+ lines, handles multi-auth)
- `home.tsx` - DJ discovery & main feed
- `perfil.tsx` - User profile with image picker integration
- `registro-dj.tsx` - DJ registration form with Supabase write
- `BienvenidaScreen.tsx`, `welcomescreen.tsx` - Onboarding screens

**Navigation Pattern:** File paths directly become routes (e.g., `app/home.tsx` → `/home`). The tab bar is explicitly hidden via `tabBarStyle: { display: 'none' }` in `_layout.tsx`.

### Backend Integration (`lib/supabase.ts`)
**Single source of truth for Supabase client:**
- **URL/Key:** Hardcoded in production (security consideration for open-source)
- **Auth Methods:**
  - `signInWithGoogle()` - OAuth redirects via WebBrowser
  - `signInWithMicrosoft()` - Similar pattern to Google
  - `signInWithFacebook()` - OAuth flow
  - `getCurrentUser()` - Fetches session from Supabase auth
- **User Profile Interface:**
  ```typescript
  interface UserProfile {
    id: string; user_id: string; first_name: email: string; provider: string;
    created_at: string; updated_at: string;
  }
  ```
- **Async Storage Persistence:** Profile images stored in device storage (`@mivok/profile_image` key)

### Data Persistence Strategy
- **Supabase:** User authentication, DJ profiles, booking metadata
- **AsyncStorage:** Profile image paths (`@mivok/profile_image`), DJ registration flag (`@mivok/is_dj_registered`)
- **Image Handling:** Uses `expo-image-picker` to capture/select photos; base64 strings stored locally

## Critical Developer Workflows

### Local Development
```powershell
npm install                    # Install dependencies
npm start                      # Start Expo dev server (prompts for platform)
npm run android               # Run on Android emulator
npm run ios                   # Run on iOS simulator  
npm run web                   # Run on web browser
npm run lint                  # Run ESLint (expo/flat config)
```

### Testing OAuth Flows
- OAuth redirects use `Linking.createURL('/')` for dynamic deep linking
- **Local Testing:** Use Expo Go app or dev client (`expo-dev-client`)
- **Redirect URL Pattern:** `<scheme>://` from `app.json` (scheme: `mivokappproject`)

### Debugging Tips
- **Redux/State:** Use `AsyncStorage` inspection in device settings
- **Supabase Auth:** Check `hasActiveSession()` function and auth state listeners
- **Images:** Stored as local paths; verify paths exist before rendering

## Project-Specific Conventions

### Component Naming & Organization
- **Screens:** PascalCase (e.g., `BienvenidaScreen.tsx`)
- **Components:** PascalCase + functional exports (e.g., `HapticTab.tsx`)
- **Utilities:** camelCase in `lib/` or `constants/`
- **No barrel exports:** Import directly from source files

### Styling Patterns
- **Responsive Units** (`app/index.tsx` exemplifies this):
  ```typescript
  const wp = (percentage: number) => (width * percentage) / 100;
  const hp = (percentage: number) => (height * percentage) / 100;
  const fp = (percentage: number) => (width / 375) * percentage;
  ```
  Use `wp()`, `hp()` for screen-percentage layouts; `fp()` for font scaling relative to iPhone X baseline.
- **Platform Adjustments:**
  ```typescript
  const iosAdjust = (iosValue: number, androidValue: number = iosValue) =>
    Platform.OS === 'ios' ? iosValue : androidValue;
  ```
- **Colors:** Centralized in `constants/Colors.ts` (light/dark scheme dicts)
- **Gradients:** Custom linear gradients via `expo-linear-gradient` (e.g., button gradients in `index.tsx`)

### UI/UX Conventions
- **Icons:** Mix of Expo Vector Icons (`@expo/vector-icons`) and custom SVG (e.g., `HomeIcon`, `MenuIcon` components in screens)
- **Haptic Feedback:** iOS haptic feedback on tab presses (`HapticTab.tsx` uses `expo-haptics`)
- **Safe Area:** Use `SafeAreaView` for portrait-oriented apps
- **Custom Tab Bar:** Hidden native tab bar; manual navigation buttons with gradients

### String/Resource Conventions
- Spanish-first development (UI strings in Spanish, e.g., "Bienvenida", "Regístrate", "DJ")
- Comments use emoji prefixes for clarity (e.g., `// 🔄 Iniciando...`, `// ✅ URL OAuth generada`)

## Integration Points & External Dependencies

### Supabase Integration
- **Session Persistence:** `persistSession: true`, `autoRefreshToken: true` in client config
- **Deep Linking:** `detectSessionInUrl: false` (handled manually)
- **Auth Flow:** OAuth URLs generated, opened in WebBrowser, then parsed for session data
- **Profile Syncing:** Profile name fetched from Supabase on screen focus (via `useFocusEffect`)

### Image Picker Integration
- **Workflow:** `expo-image-picker` → local AsyncStorage → display in multiple screens
- **Sync Pattern:** `useFocusEffect` hook reloads profile image when screen gains focus (prevents stale images)

### Navigation Patterns
- **useRouter():** For programmatic navigation (e.g., `router.push('/home')`)
- **useFocusEffect():** Reload data when screen becomes active (e.g., profile image sync in `home.tsx`)
- **Route Structure:** Flat app structure; no nested routes currently

## Common Patterns to Apply

1. **Async Storage Keys:** Prefix with `@mivok/` (e.g., `@mivok/profile_image`, `@mivok/is_dj_registered`)
2. **Alert Pattern:** Use `Alert.alert('Title', 'Message')` for user feedback before long operations
3. **Loading States:** Wrap Supabase calls in `setLoading(true/false)` with UI disabled during requests
4. **Error Logging:** Use console with emoji prefixes (`console.log('🔄 ...')`, `console.error('❌ ...')`)
5. **Type Safety:** Define interfaces for DB shapes (e.g., `UserProfile` in `lib/supabase.ts`)

## Key Files Reference

- **Authentication & Backend:** `lib/supabase.ts` (524 lines; auth methods, profile interface)
- **Welcome/Entry:** `app/index.tsx` (771 lines; multi-auth flows, animations)
- **Home Screen:** `app/home.tsx` (358 lines; DJ list, profile image loading)
- **DJ Registration:** `app/registro-dj.tsx` (361 lines; form validation, Supabase write)
- **Profile Screen:** `app/perfil.tsx` (482 lines; image picker, user settings, logout)
- **Responsive Utilities:** `app/index.tsx` lines 22-27 (wp, hp, fp functions)
- **Theme Colors:** `constants/Colors.ts` (light/dark scheme)

## Build & Deployment Notes

- **Platform Bundles:** `app.json` specifies iOS bundleId, Android package, Web output
- **Splash Screen:** Custom splash via `expo-splash-screen` plugin
- **EAS Build Ready:** `eas.json` configured for native builds (not visible but typical Expo setup)
- **TypeScript:** Strict mode enabled; paths alias `@/*` maps to root

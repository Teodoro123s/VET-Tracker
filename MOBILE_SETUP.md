# Mobile Setup Guide

## Overview
The VetClinic application has been optimized for mobile devices using React Native and Expo. This guide covers the mobile-specific features and setup.

## Mobile Features

### 1. Responsive Design
- **Mobile-first approach**: Optimized for phones and tablets
- **Adaptive layouts**: Tables convert to card views on mobile
- **Touch-friendly**: Minimum 48px touch targets
- **Responsive typography**: Scales based on screen size

### 2. Mobile Navigation
- **Drawer Navigation**: Replaces sidebar on mobile devices
- **Mobile Header**: Hamburger menu and contextual actions
- **Gesture Support**: Swipe gestures for navigation

### 3. Mobile Components
- **MobileDrawer**: Side navigation drawer for mobile
- **MobileHeader**: Top navigation bar with menu button
- **MobileTable**: Card-based table view for mobile screens

### 4. Mobile Optimizations
- **Empty States**: Consistent empty state messages
- **Search**: Mobile-optimized search inputs
- **Forms**: Touch-friendly form controls
- **Modals**: Full-screen modals on mobile

## Installation

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## Mobile-Specific Files

### Components
- `components/MobileDrawer.tsx` - Mobile navigation drawer
- `components/MobileHeader.tsx` - Mobile header component
- `components/MobileTable.tsx` - Mobile table component
- `components/LoginMobile.tsx` - Mobile login screen

### Utilities
- `utils/responsive.ts` - Responsive design utilities
- `constants/Typography.ts` - Mobile typography scales
- `constants/Colors.ts` - Color scheme

### Screens
All main screens have been optimized for mobile:
- Dashboard
- Appointments
- Customers
- Records
- Settings

## Configuration

### App Configuration (`app.json`)
- **Orientation**: Supports both portrait and landscape
- **Status Bar**: Dark content for better visibility
- **Keyboard**: Pan mode for Android
- **Edge-to-Edge**: Modern Android experience

### Responsive Breakpoints
- **Small Phone**: ≤ 360px
- **Standard Phone**: 361-414px
- **Tablet**: 415-767px
- **Desktop**: ≥ 768px

## Development Guidelines

### Mobile-First Design
1. Design for mobile screens first
2. Use responsive utilities for sizing
3. Test on actual devices
4. Consider touch interactions

### Performance
- Optimize images for mobile
- Use lazy loading for large lists
- Minimize bundle size
- Cache frequently used data

### Testing
- Test on various screen sizes
- Verify touch targets are accessible
- Check keyboard behavior
- Test offline functionality

## Deployment

### Android
1. Build APK: `expo build:android`
2. Test on device
3. Submit to Google Play Store

### iOS
1. Build IPA: `expo build:ios`
2. Test on device
3. Submit to App Store

### Web
1. Build web: `expo build:web`
2. Deploy to hosting service
3. Configure PWA settings

## Troubleshooting

### Common Issues
1. **Layout Issues**: Check responsive utilities
2. **Touch Problems**: Verify minimum touch targets
3. **Navigation**: Ensure proper drawer integration
4. **Performance**: Profile with React DevTools

### Debug Commands
```bash
# Clear cache
expo start -c

# Reset project
npm run reset-project

# Check bundle size
npx expo-bundle-analyzer
```

## Support
For mobile-specific issues, check:
- Expo documentation
- React Native guides
- Device-specific considerations
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

interface MobileWebLayoutProps {
  children: React.ReactNode;
}

export default function MobileWebLayout({ children }: MobileWebLayoutProps) {
  useEffect(() => {
    // Only run on web for veterinarian routes
    if (typeof window !== 'undefined') {
      const setMobileDimensions = () => {
        const currentPath = window.location.pathname;
        const isVetRoute = currentPath.startsWith('/veterinarian/');
        const isDesktop = window.innerWidth >= 768;
        
        if (isVetRoute && isDesktop) {
          // Create mobile frame styling for vet routes only
          document.body.setAttribute('data-vet-route', 'true');
          document.body.style.display = 'flex';
          document.body.style.justifyContent = 'center';
          document.body.style.alignItems = 'center';
          document.body.style.minHeight = '100vh';
          document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          document.body.style.margin = '0';
          document.body.style.padding = '20px';
          
          const rootElement = document.getElementById('root');
          if (rootElement) {
            rootElement.style.width = '375px';
            rootElement.style.maxWidth = '375px';
            rootElement.style.height = '812px';
            rootElement.style.maxHeight = '812px';
            rootElement.style.borderRadius = '25px';
            rootElement.style.overflow = 'hidden';
            rootElement.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            rootElement.style.border = '8px solid #2c3e50';
            rootElement.style.position = 'relative';
            rootElement.style.background = 'white';
          }
        } else {
          // Reset to normal for admin/superadmin or mobile
          document.body.removeAttribute('data-vet-route');
          document.body.style.display = '';
          document.body.style.justifyContent = '';
          document.body.style.alignItems = '';
          document.body.style.minHeight = '';
          document.body.style.background = '';
          document.body.style.margin = '0';
          document.body.style.padding = isVetRoute ? '0' : '';
          
          const rootElement = document.getElementById('root');
          if (rootElement) {
            rootElement.style.width = isVetRoute ? '100vw' : '';
            rootElement.style.height = isVetRoute ? '100vh' : '';
            rootElement.style.maxWidth = 'none';
            rootElement.style.maxHeight = 'none';
            rootElement.style.borderRadius = '0';
            rootElement.style.border = 'none';
            rootElement.style.boxShadow = 'none';
            rootElement.style.position = '';
            rootElement.style.background = '';
          }
        }
      };

      setMobileDimensions();
      window.addEventListener('resize', setMobileDimensions);
      window.addEventListener('popstate', setMobileDimensions);
      
      return () => {
        window.removeEventListener('resize', setMobileDimensions);
        window.removeEventListener('popstate', setMobileDimensions);
      };
    }
  }, []);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
import { Href, Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import  from 'react';
import { Platform } from 'react-native';
export function ExternalLink({ href, ...rest }: Props) {
  return (
     {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        }
      }}
    />
  );
}

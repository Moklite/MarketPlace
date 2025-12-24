import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import React, { useRef, useEffect } from 'react';

export default function App() {
  const webViewRef = useRef(null);

  // Handle Deep Linking
  useEffect(() => {
    const handleUrl = (event) => {
      const { url } = event;

      // Dismiss the system browser if it's open
      WebBrowser.dismissBrowser();

      // Parse the URL to find the token
      // Logic: Split by '?' then '&' to find 'token='
      try {
        const queryParams = url.split("?")[1];
        if (queryParams) {
          const params = queryParams.split("&");
          let token = null;
          for (let param of params) {
            const [key, value] = param.split("=");
            if (key === "token") {
              token = value;
              break;
            }
          }

          if (token && webViewRef.current) {
            // Determine cookie name - default 'token', assuming backend sets this
            const cookieScript = `
                    document.cookie = "token=${token}; path=/; domain=.base44.app; secure; samesite=lax";
                    window.location.reload();
                `;
            webViewRef.current.injectJavaScript(cookieScript);
            return; // Stop here, we handled the login
          }
        }
      } catch (e) {
        console.log("Error parsing URL", e);
      }

      // Fallback reload if no token found but we returned
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleShouldStartLoadWithRequest = (request) => {
    // Check if the URL is for Google Auth
    const isGoogleAuth =
      request.url.includes('accounts.google.com') ||
      request.url.includes('google.com/o/oauth2');

    if (isGoogleAuth) {
      // Open in system browser
      WebBrowser.openBrowserAsync(request.url);
      // Stop WebView from loading it
      return false;
    }

    // Add other external link checks here if needed (e.g. whatsapp, mailto)

    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://bulkafrica.base44.app/Home' }}
        style={styles.webview}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        // Required for onShouldStartLoadWithRequest on Android
        setSupportMultipleWindows={false}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

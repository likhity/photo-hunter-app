import { useFonts } from 'expo-font';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingScreen({ onLogin, onSignup }: LandingScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Logo and Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoImageContainer}>
              <Image
                source={require('~/assets/photohunt-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                <Text style={styles.titleBlack}>Photo</Text>
                <Text style={styles.titleRed}>Hunter</Text>
              </Text>
            </View>
          </View>
          <Text style={styles.tagline}>The scavenger hunt for photos.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={onSignup} activeOpacity={0.8}>
            <Text style={styles.signupButtonText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 32,
    fontWeight: '700',
  },
  titleBlack: {
    color: '#1F2937',
  },
  titleRed: {
    color: '#E14545',
  },
  tagline: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  lineContainer: {
    position: 'absolute',
    top: height * 0.4,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  dashedLine: {
    position: 'absolute',
    top: 0,
    left: width * 0.4,
    width: 2,
    height: 200,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E14545',
    borderRadius: 1,
    transform: [{ translateX: -1 }, { rotate: '15deg' }],
  },
  buttonsContainer: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#E14545',
  },
  signupButton: {
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#E14545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

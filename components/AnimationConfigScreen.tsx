import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';

import { useAnimation } from '~/providers/AnimationProvider';

interface AnimationConfigScreenProps {
  onClose: () => void;
}

export default function AnimationConfigScreen({ onClose }: AnimationConfigScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const { animationConfig, updateAnimationConfig, setShowSplash } = useAnimation();
  const [tempConfig, setTempConfig] = useState(animationConfig);

  const handleSave = () => {
    updateAnimationConfig(tempConfig);
    Alert.alert('Saved', 'Animation configuration updated!');
  };

  const handleReset = () => {
    setTempConfig({
      duration: 2000,
      iconScale: 3,
      phases: {
        iconAppear: 800,
        hold: 400,
        expand: 600,
        fadeOut: 300,
      },
    });
  };

  const handleTest = () => {
    setShowSplash(true);
    onClose();
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Animation Config</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Animation Config</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Duration</Text>
          <TextInput
            style={styles.input}
            value={tempConfig.duration.toString()}
            onChangeText={(text) =>
              setTempConfig((prev) => ({ ...prev, duration: parseInt(text, 10) || 2000 }))
            }
            keyboardType="numeric"
            placeholder="Duration in ms"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon Scale</Text>
          <TextInput
            style={styles.input}
            value={tempConfig.iconScale.toString()}
            onChangeText={(text) =>
              setTempConfig((prev) => ({ ...prev, iconScale: parseFloat(text) || 3 }))
            }
            keyboardType="numeric"
            placeholder="Final scale multiplier"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animation Phases</Text>

          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>Icon Appear:</Text>
            <TextInput
              style={styles.phaseInput}
              value={tempConfig.phases.iconAppear.toString()}
              onChangeText={(text) =>
                setTempConfig((prev) => ({
                  ...prev,
                  phases: { ...prev.phases, iconAppear: parseInt(text, 10) || 800 },
                }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>Hold:</Text>
            <TextInput
              style={styles.phaseInput}
              value={tempConfig.phases.hold.toString()}
              onChangeText={(text) =>
                setTempConfig((prev) => ({
                  ...prev,
                  phases: { ...prev.phases, hold: parseInt(text, 10) || 400 },
                }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>Expand:</Text>
            <TextInput
              style={styles.phaseInput}
              value={tempConfig.phases.expand.toString()}
              onChangeText={(text) =>
                setTempConfig((prev) => ({
                  ...prev,
                  phases: { ...prev.phases, expand: parseInt(text, 10) || 600 },
                }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>Fade Out:</Text>
            <TextInput
              style={styles.phaseInput}
              value={tempConfig.phases.fadeOut.toString()}
              onChangeText={(text) =>
                setTempConfig((prev) => ({
                  ...prev,
                  phases: { ...prev.phases, fadeOut: parseInt(text, 10) || 300 },
                }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={handleTest}>
          <Text style={styles.testButtonText}>Test Animation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E14545',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontFamily: 'Sen',
    fontSize: 18,
    color: '#FFFFFF',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Sen',
    color: '#FFFFFF',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseLabel: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    width: 100,
  },
  phaseInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Sen',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  testButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#E14545',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

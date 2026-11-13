import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  return (
    <LinearGradient colors={['#10152A', '#151B35']} style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to jump into your next LudoVerse match.</Text>

        <View style={styles.card}>
          <TextInput placeholder="Email or username" placeholderTextColor="#91A6D6" style={styles.input} />
          <TextInput placeholder="Password" secureTextEntry placeholderTextColor="#91A6D6" style={styles.input} />

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/home')}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#F4F7FF' }]}>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1A1F2E' }]}>
            <Text style={styles.socialText}>Guest mode</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.ghostButton} onPress={() => router.replace('/home')}>
          <Text style={styles.ghostButtonText}>Continue without login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    color: '#B3C3E7',
    fontSize: 14,
    marginBottom: 18,
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#243B73',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    marginBottom: 14,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#10152A',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#AFC5FF',
    fontWeight: '600',
  },
  socialRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  socialText: {
    fontWeight: '700',
    color: '#10152A',
  },
  ghostButton: {
    marginTop: 22,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#DDE8FF',
    fontWeight: '700',
    fontSize: 15,
  },
});

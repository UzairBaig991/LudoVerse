import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getReadableAuthError, loginWithEmail, registerWithEmail, sendPasswordReset, signInAsFirebaseGuest } from '../services/auth/firebaseAuth';
import { isFirebaseConfigured } from '../services/firebase/client';

export default function AuthScreen() {
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const runAuthAction = async (action: () => Promise<unknown>, successMessage?: string) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
      if (successMessage) {
        setNotice(successMessage);
        return;
      }
      router.replace('/home');
    } catch (authError) {
      setError(getReadableAuthError(authError));
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    if (creatingAccount && password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    void runAuthAction(() => creatingAccount
      ? registerWithEmail(email, password, displayName)
      : loginWithEmail(email, password));
  };

  return (
    <LinearGradient colors={['#10152A', '#151B35']} style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{creatingAccount ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>{creatingAccount ? 'Save your profile and return to your games.' : 'Sign in to your LudoVerse account.'}</Text>

          {!isFirebaseConfigured ? (
            <View style={styles.setupNotice}>
              <Text style={styles.setupNoticeText}>Online sign-in needs Firebase values in your local .env file. Offline play is available without an account.</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            {creatingAccount ? (
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name (optional)"
                placeholderTextColor="#91A6D6"
                style={styles.input}
                autoCapitalize="words"
                maxLength={24}
              />
            ) : null}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#91A6D6"
              style={styles.input}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor="#91A6D6"
              style={styles.input}
              autoComplete={creatingAccount ? 'new-password' : 'current-password'}
            />

            <TouchableOpacity style={[styles.primaryButton, busy && styles.disabledButton]} onPress={submitCredentials} disabled={busy}>
              {busy ? <ActivityIndicator color="#10152A" /> : <Text style={styles.primaryButtonText}>{creatingAccount ? 'Create account' : 'Sign in'}</Text>}
            </TouchableOpacity>

            {!creatingAccount ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  if (!email.trim() || !email.includes('@')) {
                    setError('Enter your email address first.');
                    return;
                  }
                  void runAuthAction(() => sendPasswordReset(email), 'Password reset email sent.');
                }}
                disabled={busy}
              >
                <Text style={styles.secondaryButtonText}>Forgot password?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text accessibilityRole="status" style={styles.noticeText}>{notice}</Text> : null}

          <TouchableOpacity style={styles.modeToggle} onPress={() => { setCreatingAccount((value) => !value); setError(''); setNotice(''); }}>
            <Text style={styles.modeToggleText}>{creatingAccount ? 'Already registered? Sign in' : 'New to LudoVerse? Create an account'}</Text>
          </TouchableOpacity>

          <View style={styles.socialRow}>
            <View style={[styles.socialButton, styles.googleButton]}>
              <Text style={styles.googleText}>Google sign-in setup pending</Text>
            </View>
            <TouchableOpacity
              style={[styles.socialButton, styles.guestButton, (!isFirebaseConfigured || busy) && styles.disabledButton]}
              onPress={() => void runAuthAction(() => signInAsFirebaseGuest())}
              disabled={!isFirebaseConfigured || busy}
            >
              <Text style={styles.guestText}>Guest account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.ghostButton} onPress={() => router.replace('/home')}>
            <Text style={styles.ghostButtonText}>Continue without login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  title: { color: '#FFFFFF', fontWeight: '800', fontSize: 32, marginBottom: 4 },
  subtitle: { color: '#B3C3E7', fontSize: 14, marginBottom: 18 },
  setupNotice: { backgroundColor: 'rgba(33,150,243,0.12)', borderWidth: 1, borderColor: 'rgba(33,150,243,0.35)', borderRadius: 14, padding: 12, marginBottom: 14 },
  setupNoticeText: { color: '#C8DAFF', fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 },
  input: { backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#243B73', paddingHorizontal: 16, paddingVertical: 14, color: '#FFFFFF', marginBottom: 14, fontSize: 15 },
  primaryButton: { backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, minHeight: 52 },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 16 },
  disabledButton: { opacity: 0.55 },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#AFC5FF', fontWeight: '600' },
  errorText: { color: '#FF9B9B', fontSize: 13, marginTop: 12, lineHeight: 19 },
  noticeText: { color: '#9BE7B0', fontSize: 13, marginTop: 12, lineHeight: 19 },
  modeToggle: { marginTop: 18, alignItems: 'center' },
  modeToggleText: { color: '#DDE8FF', fontWeight: '700', fontSize: 14 },
  socialRow: { marginTop: 18, flexDirection: 'row', gap: 12 },
  socialButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 14 },
  googleButton: { backgroundColor: '#F4F7FF' },
  googleText: { fontWeight: '700', color: '#69738B', fontSize: 11, textAlign: 'center' },
  guestButton: { backgroundColor: '#1A1F2E' },
  guestText: { fontWeight: '700', color: '#FFFFFF', fontSize: 13 },
  ghostButton: { marginTop: 22, alignItems: 'center' },
  ghostButtonText: { color: '#DDE8FF', fontWeight: '700', fontSize: 15 },
});

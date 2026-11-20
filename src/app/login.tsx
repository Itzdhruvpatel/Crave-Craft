import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authReady, sendEmailCode, signInWithGoogle, useSession, verifyEmailCode } from '@/auth';
import { LangSwitch } from '@/components/lang-switch';
import { Headline, T } from '@/components/ui';
import { font } from '@/constants/fonts';
import { MaxContentWidth } from '@/constants/theme';
import { PHOTOS } from '@/data/photos';
import { continueAsGuest, useLangNow, useT } from '@/state';

const INK = '#10140A';
const CREAM = '#FFFFFF';

export default function Login() {
  const t = useT();
  const lang = useLangNow();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'start' | 'email' | 'code'>('start');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { session } = useSession();

  // Google or the email code worked: go on to setup or the app.
  useEffect(() => {
    if (session) router.replace('/');
  }, [session]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const google = () => run(signInWithGoogle);
  const send = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('badEmail'));
    run(async () => {
      await sendEmailCode(email.trim());
      setStep('code');
    });
  };
  const verify = () => {
    if (!/^\d{6}$/.test(code.trim())) return setError(t('badCode'));
    run(() => verifyEmailCode(email.trim(), code.trim()));
  };
  const guest = () => {
    continueAsGuest();
    router.replace('/');
  };

  const input = {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    color: CREAM,
    fontSize: 17,
    fontFamily: font(lang, 400),
    paddingHorizontal: 18,
    paddingVertical: 15,
  } as const;

  const pill = (label: string, onPress: () => void, solid: boolean, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        backgroundColor: solid ? CREAM : 'rgba(255,255,255,0.12)',
        borderWidth: solid ? 0 : 1,
        borderColor: 'rgba(255,255,255,0.22)',
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}>
      <T kind="label" color={solid ? INK : CREAM}>
        {label}
      </T>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      <Image source={{ uri: PHOTOS.dal_dhokli.uri }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={300} />
      <LinearGradient
        colors={['rgba(11,13,10,0.4)', 'rgba(11,13,10,0.15)', 'rgba(11,13,10,0.92)', INK]}
        locations={[0, 0.25, 0.55, 0.8]}
        style={{ position: 'absolute', inset: 0 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            padding: 24,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
            gap: 18,
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
          }}>
          <View style={{ position: 'absolute', top: insets.top + 12, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: CREAM, fontFamily: font('en', 600), fontSize: 18 }}>
              <Text style={{ fontFamily: font('en', 300) }}>Mummy </Text>Said So
            </Text>
            <LangSwitch />
          </View>

          <Headline a={t('loginA')} b={t('loginB')} size={52} />
          <T color="rgba(255,255,255,0.72)" style={{ fontSize: 18, lineHeight: 27 }}>
            {t('loginBody')}
          </T>

          {!authReady && (
            <T kind="small" color="#CFF54A">
              {t('authOff')}
            </T>
          )}

          {step === 'start' && (
            <View style={{ gap: 12, marginTop: 6 }}>
              {pill(t('google'), google, true, !authReady)}
              {pill(t('email'), () => setStep('email'), false, !authReady)}
            </View>
          )}

          {step === 'email' && (
            <View style={{ gap: 12, marginTop: 6 }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoFocus
                onSubmitEditing={send}
                accessibilityLabel={t('emailPlaceholder')}
                style={input}
              />
              {pill(t('sendCode'), send, true)}
            </View>
          )}

          {step === 'code' && (
            <View style={{ gap: 12, marginTop: 6 }}>
              <T color="rgba(255,255,255,0.72)">
                {t('codeSent')} {email.trim()}
              </T>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('codePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoFocus
                onSubmitEditing={verify}
                accessibilityLabel={t('codePlaceholder')}
                style={[input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]}
              />
              {pill(t('verify'), verify, true)}
              <Pressable accessibilityRole="button" onPress={() => setStep('email')} style={{ alignSelf: 'center', padding: 6 }}>
                <T kind="small" color={CREAM}>
                  {t('changeEmail')}
                </T>
              </Pressable>
            </View>
          )}

          {busy && <ActivityIndicator />}
          {error ? (
            <T kind="small" color="#FF8A93" style={{ textAlign: 'center' }}>
              {error}
            </T>
          ) : null}

          <Pressable accessibilityRole="button" onPress={guest} style={{ alignSelf: 'center', padding: 10 }}>
            <T kind="label" color={CREAM} style={{ textDecorationLine: 'underline' }}>
              {t('guest')}
            </T>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState } from 'react';

import { SPEECH_LANG } from '@/lib/i18n.ts';
import type { Lang } from '@/lib/types.ts';

/** Speech to text with the phone's own recognizer (Google on Android, the browser on web). */
export function useListen(lang: Lang, onHeard: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (e) => {
    if (e.isFinal && e.results[0]?.transcript) onHeard(e.results[0].transcript);
  });
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    if (e.error !== 'no-speech' && e.error !== 'aborted') setError(e.message);
  });

  const start = async () => {
    setError('');
    if (listening) return ExpoSpeechRecognitionModule.stop();
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return setError('unavailable');
    if (!(await ExpoSpeechRecognitionModule.requestPermissionsAsync()).granted) return setError('denied');
    ExpoSpeechRecognitionModule.start({ lang: SPEECH_LANG[lang], interimResults: false, continuous: false });
  };

  return { listening, error, start };
}

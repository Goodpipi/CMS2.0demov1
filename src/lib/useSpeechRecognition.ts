import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'unsupported';

export function useSpeechRecognition(options?: {
  lang?: string;
  onFinal?: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
}) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>(() => {
    if (typeof window === 'undefined') return 'unsupported';
    const w = window as SpeechWindow;
    return w.SpeechRecognition || w.webkitSpeechRecognition ? 'idle' : 'unsupported';
  });
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stoppingRef = useRef(false);
  const onFinalRef = useRef(options?.onFinal);
  const onInterimRef = useRef(options?.onInterim);
  onFinalRef.current = options?.onFinal;
  onInterimRef.current = options?.onInterim;

  const stop = useCallback(() => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
    setStatus((prev) => (prev === 'unsupported' ? prev : 'idle'));
    setInterimTranscript('');
  }, []);

  const abort = useCallback(() => {
    stoppingRef.current = true;
    recognitionRef.current?.abort();
    setStatus((prev) => (prev === 'unsupported' ? prev : 'idle'));
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    const w = window as SpeechWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus('unsupported');
      return false;
    }
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    const recognition = new Ctor();
    recognition.lang = options?.lang || 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    stoppingRef.current = false;

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk) onFinalRef.current?.(finalChunk);
      setInterimTranscript(interim);
      if (interim) onInterimRef.current?.(interim);
    };

    recognition.onerror = () => {
      if (!stoppingRef.current) {
        setStatus('idle');
        setInterimTranscript('');
      }
    };

    recognition.onend = () => {
      if (!stoppingRef.current) {
        // Some browsers end unexpectedly; keep UI idle unless user stopped.
        setStatus('idle');
      }
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setStatus('listening');
      return true;
    } catch {
      setStatus('idle');
      return false;
    }
  }, [options?.lang]);

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    },
    []
  );

  return {
    status,
    supported: status !== 'unsupported',
    listening: status === 'listening',
    interimTranscript,
    start,
    stop,
    abort,
  };
}

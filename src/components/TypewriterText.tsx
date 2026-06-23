import React, { useState, useEffect } from 'react';

interface Props {
  text: string;
  messageId: string;
  onType?: () => void;
}

export function TypewriterText({ text, messageId, onType }: Props) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Jika pesan ini sudah pernah di-type di sesi ini, tampilkan langsung semua
    if (sessionStorage.getItem(`typed-${messageId}`)) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    // Ketik 2 karakter per 20ms agar lebih natural (tidak terlalu lambat/cepat)
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i += 2; 
      
      if (onType) onType();

      if (i >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
        sessionStorage.setItem(`typed-${messageId}`, 'true');
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, messageId, onType]);

  return <>{displayedText}</>;
}

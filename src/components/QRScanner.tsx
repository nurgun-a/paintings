import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle, Sparkles } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  expectedValue?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, expectedValue }) => {
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check camera availability safely
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setCameraPermissionGranted(true);
        })
        .catch((err) => {
          console.warn('Camera permission blocked or unavailable:', err);
          setCameraPermissionGranted(false);
        });
    } else {
      console.warn('Camera API (getUserMedia) not supported or unavailable in this environment');
      setCameraPermissionGranted(false);
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(e => console.error('Failed to clear qr scanner', e));
        onScanSuccess(decodedText);
      },
      (error) => {
        // Keep scanning, silent errors are standard for frame-by-frame scanner
      }
    );

    return () => {
      scanner.clear().catch(err => {
        // Safe to ignore if scanner wasn't fully initialized
      });
    };
  }, [onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {cameraPermissionGranted === false && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            Камера недоступна или заблокирована настройками браузера. 
            Пожалуйста, разрешите доступ к камере или введите код вручную ниже.
          </div>
        </div>
      )}

      {/* Reader Container */}
      <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
        <div id="qr-reader-container" className="w-full"></div>
        
        {/* Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-white/40">
          <div className="text-[10px] uppercase tracking-widest font-mono bg-black/60 px-3 py-1 rounded-full text-teal-400 mb-2 border border-teal-500/20">
            Сканер QR-кода
          </div>
        </div>
      </div>

      {/* Manual Fallback */}
      <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Или введите найденный секретный код вручную:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Введите текст QR-кода..."
              className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Проверить
            </button>
          </div>
          {expectedValue && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono italic">
              Подсказка разработчика: Секретный код — "{expectedValue}"
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

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
    let activeStream: MediaStream | null = null;
    let scanner: any = null;
    let isMounted = true;

    // Check camera availability safely
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            if (!isMounted) {
              stream.getTracks().forEach(track => track.stop());
              return;
            }
            setCameraPermissionGranted(true);
            activeStream = stream;
            // Stop tracks immediately as we only wanted to check permissions
            stream.getTracks().forEach(track => track.stop());
          })
          .catch((err) => {
            console.warn('Camera permission blocked or unavailable:', err);
            if (isMounted) setCameraPermissionGranted(false);
          });
      } else {
        console.warn('Camera API (getUserMedia) not supported or unavailable in this environment');
        if (isMounted) setCameraPermissionGranted(false);
      }
    } catch (e) {
      console.warn('Error checking camera availability:', e);
      if (isMounted) setCameraPermissionGranted(false);
    }

    const initScanner = async () => {
      // Delay slightly to allow any previous unmount clear() to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      if (!isMounted) return;

      const container = document.getElementById('qr-reader-container');
      if (!container) return;

      // If the container already contains HTML/elements, don't re-initialize
      if (container.children.length > 0) {
        console.warn('QR scanner already rendering or container not empty');
        return;
      }

      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText: string) => {
            if (scanner && typeof scanner.clear === 'function') {
              scanner.clear()
                .then(() => {
                  if (isMounted) onScanSuccess(decodedText);
                })
                .catch((e: any) => {
                  console.error('Failed to clear qr scanner', e);
                  if (isMounted) onScanSuccess(decodedText);
                });
            } else {
              if (isMounted) onScanSuccess(decodedText);
            }
          },
          (error: any) => {
            // Keep scanning, silent errors are standard for frame-by-frame scanner
          }
        );
      } catch (err) {
        console.error('Failed to initialize HTML5 QR Scanner:', err);
        if (isMounted) setScanError('Не удалось запустить сканер кодов.');
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (activeStream) {
        try {
          activeStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
      if (scanner) {
        try {
          // Only attempt to clear if the element is still present in the DOM
          if (document.getElementById('qr-reader-container')) {
            const clearPromise = scanner.clear();
            if (clearPromise && typeof clearPromise.catch === 'function') {
              clearPromise.catch((err: any) => {
                console.warn('Non-fatal error clearing QR scanner asynchronously:', err);
              });
            }
          }
        } catch (err) {
          console.warn('Non-fatal error clearing QR scanner synchronously:', err);
        }
      }
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

      {scanError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {scanError} Используйте ручной ввод кода ниже.
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
            Или введите найденный секретный код вручную (нажмите Enter для подтверждения):
          </label>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Введите текст QR-кода и нажмите Enter..."
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
          />
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

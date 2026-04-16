import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Toast } from 'primereact/toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const show = useCallback((severity, summary, detail, life = 3000) => {
    toastRef.current?.show({ severity, summary, detail, life });
  }, []);

  const toast = {
    success: (msg) => show('success', 'Success', msg),
    error: (msg) => show('error', 'Error', msg),
    info: (msg) => show('info', 'Info', msg),
    warn: (msg) => show('warn', 'Warning', msg),
    // Support either warning or warn
    warning: (msg) => show('warn', 'Warning', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      <Toast ref={toastRef} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

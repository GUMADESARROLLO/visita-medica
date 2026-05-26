export {};

declare global {
  interface Window {
    showToast: (message: string, type?: string) => void;
  }
}

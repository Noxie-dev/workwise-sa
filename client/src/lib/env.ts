// Access environment variables
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
import { sendSignInLink, getEmailFromStorage, completeSignInWithEmailLink } from '@/lib/firebase';

// Mock the entire firebase/auth module
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  sendSignInLinkToEmail: jest.fn(() => Promise.resolve()),
  signInWithEmailLink: jest.fn(() => Promise.resolve({ user: { uid: '123' } })),
  isSignInWithEmailLink: jest.fn(),
}));

// Mock storage
let storage: { [key: string]: string } = {};

const mockStorage = {
  getItem: jest.fn((key: string) => storage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
  }),
  clear: jest.fn(() => {
    storage = {};
  }),
};

const mockLocalStorage = { ...mockStorage };
const mockSessionStorage = { ...mockStorage };

// A spy on console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
});

afterEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  consoleErrorSpy.mockClear();
});


describe('Email Link Authentication', () => {

  describe('sendSignInLink', () => {
    it('should use sessionStorage to store the email', async () => {
      const email = 'test@example.com';
      const setItemSpy = jest.spyOn(window.sessionStorage, 'setItem');
      const localStorageSetItemSpy = jest.spyOn(window.localStorage, 'setItem');

      await sendSignInLink(email);

      expect(setItemSpy).toHaveBeenCalledWith('emailForSignIn', email);
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('getEmailFromStorage', () => {
    it('should retrieve the email from sessionStorage', () => {
      const email = 'test@example.com';
      window.sessionStorage.setItem('emailForSignIn', email);
      const getItemSpy = jest.spyOn(window.sessionStorage, 'getItem');
      const localStorageGetItemSpy = jest.spyOn(window.localStorage, 'getItem');


      const result = getEmailFromStorage();

      expect(result).toBe(email);
      expect(getItemSpy).toHaveBeenCalledWith('emailForSignIn');
      expect(localStorageGetItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('completeSignInWithEmailLink', () => {
    it('should remove the email from sessionStorage after sign-in', async () => {
      const email = 'test@example.com';
      const link = 'https://example.com/link';
      window.sessionStorage.setItem('emailForSignIn', email);
      const removeItemSpy = jest.spyOn(window.sessionStorage, 'removeItem');
      const localStorageRemoveItemSpy = jest.spyOn(window.localStorage, 'removeItem');

      await completeSignInWithEmailLink(email, link);

      expect(removeItemSpy).toHaveBeenCalledWith('emailForSignIn');
      expect(localStorageRemoveItemSpy).not.toHaveBeenCalled();
    });
  });
});

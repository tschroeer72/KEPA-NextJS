import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            pathname: "/",
            query: {},
            asPath: "/",
        };
    },
    useSearchParams() {
        return new URLSearchParams();
    },
    usePathname() {
        return "/";
    },
}));

// Mock window.matchMedia
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // deprecated
            removeListener: jest.fn(), // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

// Mock ResizeObserver
if (typeof global !== 'undefined') {
    (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
}

// Mock scrollIntoView
if (typeof window !== 'undefined' && window.HTMLElement) {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// Suppress console errors during tests (optional)
const originalError = console.error;
const originalLog = console.log;
beforeAll(() => {
    console.log = (...args: any[]) => {
        if (
            typeof args[0] === "string" &&
            (args[0].includes("Verify Route - Token Verifikation fehlgeschlagen:") ||
             args[0].includes("Login Error"))
        ) {
            return;
        }
        originalLog.call(console, ...args);
    };
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === "string" &&
            (args[0].includes("Warning: ReactDOM.render") ||
                args[0].includes("Not implemented: HTMLFormElement.prototype.submit") ||
                args[0].includes("Error sending email:") ||
                args[0].includes("PDF Generation Error:") ||
                args[0].includes("Fehler beim Abrufen der Mitglieder:") ||
                args[0].includes("Fehler beim Aktualisieren des Benutzers:") ||
                args[0].includes("Change Password Error:") ||
                args[0].includes("<html> cannot be a child of <div>"))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.log = originalLog;
});

// Ensure no leftover timers/open handles between tests
afterEach(() => {
    try {
        jest.useRealTimers();
        jest.clearAllTimers();
    } catch {}
});
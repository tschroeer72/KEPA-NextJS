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

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === "string" &&
            (args[0].includes("Warning: ReactDOM.render") ||
                args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
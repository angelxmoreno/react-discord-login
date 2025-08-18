// test/setup.ts
import { Window } from 'happy-dom';

const window = new Window();

// Preserve original globalThis.fetch to avoid happy-dom overriding it
const originalFetch = globalThis.fetch;

Object.assign(globalThis, {
    window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    HTMLElement: window.HTMLElement,
    history: window.history,
});

// Restore original fetch (or undefined) to ensure test mocks work
globalThis.fetch = originalFetch;

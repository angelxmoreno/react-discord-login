// test/setup.ts
import { Window } from 'happy-dom';

const window = new Window();
Object.assign(globalThis, {
    window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    HTMLElement: window.HTMLElement,
    history: window.history,
});

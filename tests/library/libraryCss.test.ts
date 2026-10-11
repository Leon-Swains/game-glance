import { describe, expect, it } from 'vitest';
import { LIBRARY_CSS } from '../../src/library/libraryCss';

describe('libraryCss: Handheld and responsive layout rules', () => {
    it('contains base sgl-poster-wrapper styling', () => {
        expect(LIBRARY_CSS).toContain('.sgl-poster-wrapper');
        expect(LIBRARY_CSS).toContain('max-width: 290px');
    });

    it('contains responsive media query for handheld screens (Steam Deck <=1366px / <=850px)', () => {
        expect(LIBRARY_CSS).toContain('@media (max-width: 1366px), (max-height: 850px)');
    });

    it('defines 200px poster max-width for handheld displays', () => {
        expect(LIBRARY_CSS).toContain('max-width: 200px');
        expect(LIBRARY_CSS).toContain('max-width: 180px'); // square soundtrack cover
    });

    it('defines 300px inspector width for handheld displays to free up grid space', () => {
        expect(LIBRARY_CSS).toContain('width: 300px');
    });

    it('defines compact 48px header ribbon for handhelds', () => {
        expect(LIBRARY_CSS).toContain('height: 48px');
    });

    it('provides explicit .sgl-compact modifier rules for device mode toggle', () => {
        expect(LIBRARY_CSS).toContain('.sgl-root.sgl-compact .sgl-poster-wrapper');
        expect(LIBRARY_CSS).toContain('.sgl-root.sgl-compact .sgl-inspector');
    });

    it('defines ultra-compact rules for <=720px height viewports', () => {
        expect(LIBRARY_CSS).toContain('@media (max-height: 720px)');
    });

    it('sets 40% reduced top padding inset (42px) to optimize screen real estate', () => {
        expect(LIBRARY_CSS).toContain('padding-top: var(--sgl-top-inset, 42px) !important;');
    });

    it('includes font-size and text-size-adjust locking to protect against Steam Large Text mode distortion', () => {
        expect(LIBRARY_CSS).toContain('-webkit-text-size-adjust: 100% !important;');
        expect(LIBRARY_CSS).toContain('font-size: 14px !important;');
        expect(LIBRARY_CSS).toContain(':global(.LargeText) .sgl-root');
        expect(LIBRARY_CSS).toContain('body.LargeText .sgl-root');
    });

    it('includes grayscale and dimmed styling for uninstalled games', () => {
        expect(LIBRARY_CSS).toContain('.sgl-card.sgl-card-uninstalled');
        expect(LIBRARY_CSS).toContain('grayscale(85%)');
        expect(LIBRARY_CSS).toContain('opacity: 0.85;');
    });
});


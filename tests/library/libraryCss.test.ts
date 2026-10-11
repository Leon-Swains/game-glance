import { describe, expect, it } from 'vitest';
import { LIBRARY_CSS } from '../../src/library/libraryCss';

describe('libraryCss: Handheld and responsive layout rules', () => {
    it('contains base sgl-poster-wrapper styling with clamped height to prevent panel overflow', () => {
        expect(LIBRARY_CSS).toContain('.sgl-poster-wrapper');
        expect(LIBRARY_CSS).toContain('clamp(90px, 16vh, 130px)');
        expect(LIBRARY_CSS).toContain('max-height: 130px');
    });

    it('contains responsive media query for handheld screens (Steam Deck <=1366px / <=850px)', () => {
        expect(LIBRARY_CSS).toContain('@media (max-width: 1366px), (max-height: 850px)');
    });

    it('defines clamped poster dimensions for handheld displays', () => {
        expect(LIBRARY_CSS).toContain('aspect-ratio: 2 / 3');
        expect(LIBRARY_CSS).toContain('aspect-ratio: 1 / 1'); // square soundtrack cover
    });

    it('defines optimized inspector width to preserve grid space and prevent overflow', () => {
        expect(LIBRARY_CSS).toContain('.sgl-inspector');
        expect(LIBRARY_CSS).toContain('width: 275px !important;');
    });

    it('defines compact 44px header ribbon for handhelds', () => {
        expect(LIBRARY_CSS).toContain('height: 44px');
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
        expect(LIBRARY_CSS).toContain('html.LargeText .sgl-root');
        expect(LIBRARY_CSS).toContain('body.LargeText .sgl-root');
        expect(LIBRARY_CSS).toContain(':root .sgl-root');
        expect(LIBRARY_CSS).toContain('html body .sgl-root');
    });

    it('locks navbar, inspector, description, action buttons, and card typography with high-specificity rules', () => {
        expect(LIBRARY_CSS).toContain('.sgl-tab-label');
        expect(LIBRARY_CSS).toContain('font-size: 11px !important;');
        expect(LIBRARY_CSS).toContain('.sgl-brand');
        expect(LIBRARY_CSS).toContain('.sgl-title-text');
        expect(LIBRARY_CSS).toContain('.sgl-description');
        expect(LIBRARY_CSS).toContain('.sgl-btn-details');
        expect(LIBRARY_CSS).toContain('.sgl-btn-play');
        expect(LIBRARY_CSS).toContain('.sgl-card-fallback-title');
        expect(LIBRARY_CSS).toContain('.sgl-col-footer-title');
    });

    it('enforces clamped poster dimensions across base, handheld, and compact viewports', () => {
        expect(LIBRARY_CSS).toContain('max-width: 87px !important;');
        expect(LIBRARY_CSS).toContain('height: clamp(90px, 16vh, 130px) !important;');
        expect(LIBRARY_CSS).toContain('max-height: 130px !important;');
    });

    it('includes fast compositor-optimized grayscale and dimmed styling for uninstalled games', () => {
        expect(LIBRARY_CSS).toContain('.sgl-card.sgl-card-uninstalled');
        expect(LIBRARY_CSS).toContain('filter: grayscale(1);');
        expect(LIBRARY_CSS).toContain('opacity: 0.55;');
    });
});


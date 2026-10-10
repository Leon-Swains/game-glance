import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { LIBRARY_CSS } from '../../src/library/libraryCss';
import { BannerCard } from '../../src/library/LibraryGrid';
import { getReconciledSelectedIndex } from '../../src/library/SpotlightLibrary';
import { LibraryGameItem } from '../../src/library/libraryData';

describe('Library Scroll & Touch Navigation', () => {
    describe('LIBRARY_CSS scroll & touch properties', () => {
        it('includes touch-action pan-y and momentum scroll on sgl-grid-panel', () => {
            expect(LIBRARY_CSS).toContain('touch-action: pan-y');
            expect(LIBRARY_CSS).toContain('-webkit-overflow-scrolling: touch');
            expect(LIBRARY_CSS).toContain('overscroll-behavior-y: contain');
        });

        it('includes touch-action pan-x on sgl-tabs', () => {
            expect(LIBRARY_CSS).toContain('touch-action: pan-x');
            expect(LIBRARY_CSS).toContain('.sgl-tabs.sgl-tabs-dragging');
        });

        it('defines slim scrollbar styling on sgl-grid-panel', () => {
            expect(LIBRARY_CSS).toContain('.sgl-grid-panel::-webkit-scrollbar');
            expect(LIBRARY_CSS).toContain('.sgl-grid-panel::-webkit-scrollbar-thumb');
            expect(LIBRARY_CSS).toContain('.sgl-grid-panel.sgl-dragging');
        });

        it('prevents user drag on card images', () => {
            expect(LIBRARY_CSS).toContain('-webkit-user-drag: none');
            expect(LIBRARY_CSS).toContain('pointer-events: none');
        });
    });

    describe('getReconciledSelectedIndex', () => {
        let originalDocument: unknown;

        beforeEach(() => {
            originalDocument = globalThis.document;
            const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
            (globalThis as unknown as { document: Document }).document = document as unknown as Document;
        });

        afterEach(() => {
            if (originalDocument === undefined) {
                delete (globalThis as unknown as { document?: Document }).document;
            } else {
                (globalThis as unknown as { document: unknown }).document = originalDocument;
            }
        });

        it('returns currentIdx when totalCount is 0 or document has no grid panel', () => {
            expect(getReconciledSelectedIndex(0, 0)).toBe(0);
            expect(getReconciledSelectedIndex(5, 10)).toBe(5);
        });

        it('returns currentIdx when the current card is within visible viewport', () => {
            const container = document.createElement('main');
            container.className = 'sgl-grid-panel';
            vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
                top: 0,
                bottom: 800,
                left: 0,
                right: 1280,
                width: 1280,
                height: 800,
                x: 0,
                y: 0,
                toJSON: () => {},
            });

            const card0 = document.createElement('div');
            card0.className = 'sgl-card';
            vi.spyOn(card0, 'getBoundingClientRect').mockReturnValue({
                top: 50,
                bottom: 200,
                left: 0,
                right: 400,
                width: 400,
                height: 150,
                x: 0,
                y: 50,
                toJSON: () => {},
            });

            container.appendChild(card0);
            document.body.appendChild(container);

            expect(getReconciledSelectedIndex(0, 1)).toBe(0);
        });

        it('reconciles to the first visible card when selected card has scrolled off-screen', () => {
            const container = document.createElement('main');
            container.className = 'sgl-grid-panel';
            vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
                top: 100,
                bottom: 700,
                left: 0,
                right: 1280,
                width: 1280,
                height: 600,
                x: 0,
                y: 100,
                toJSON: () => {},
            });

            // Card 0: scrolled far above the visible viewport
            const card0 = document.createElement('div');
            card0.className = 'sgl-card';
            vi.spyOn(card0, 'getBoundingClientRect').mockReturnValue({
                top: -500,
                bottom: -350,
                left: 0,
                right: 400,
                width: 400,
                height: 150,
                x: 0,
                y: -500,
                toJSON: () => {},
            });

            // Card 1: inside visible viewport
            const card1 = document.createElement('div');
            card1.className = 'sgl-card';
            vi.spyOn(card1, 'getBoundingClientRect').mockReturnValue({
                top: 150,
                bottom: 300,
                left: 0,
                right: 400,
                width: 400,
                height: 150,
                x: 0,
                y: 150,
                toJSON: () => {},
            });

            container.appendChild(card0);
            container.appendChild(card1);
            document.body.appendChild(container);

            // Currently selected is card 0 (offscreen), should reconcile to card 1 (visible)
            expect(getReconciledSelectedIndex(0, 2)).toBe(1);
        });
    });

    describe('BannerCard drag click suppression', () => {
        const dummyGame: LibraryGameItem = {
            appId: 105600,
            name: 'Terraria',
            isShortcut: false,
            installed: true,
            running: false,
            playedMinutes: 500,
            achievements: null,
            heroic: null,
            source: 'Steam',
        };

        it('renders BannerCard HTML properly', () => {
            const html = renderToString(
                <BannerCard
                    game={dummyGame}
                    isFocused={false}
                    accent="#1a9fff"
                    onClick={() => {}}
                    onDoubleClick={() => {}}
                    isDragSuppressed={() => false}
                />
            );
            expect(html).toContain('sgl-card');
            expect(html).toContain('data-app-id="105600"');
        });
    });

    describe('LibraryCategoryBar drag & scroll', () => {
        const dummyCategories = [
            { id: 'installed', name: 'Installed', count: 12, games: [] },
            { id: 'all', name: 'All Games', count: 45, games: [] },
            { id: 'favorites', name: 'Favorites', count: 5, games: [] },
        ];

        it('renders category tabs with sgl-tabs and tab buttons', async () => {
            const { LibraryCategoryBar } = await import('../../src/library/LibraryCategoryBar');
            const html = renderToString(
                <LibraryCategoryBar
                    categories={dummyCategories}
                    activeCategoryId="installed"
                    onSelectCategory={() => {}}
                />
            );
            expect(html).toContain('sgl-tabs');
            expect(html).toContain('Installed');
            expect(html).toContain('All Games');
            expect(html).toContain('Favorites');
        });
    });
});

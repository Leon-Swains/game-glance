import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BannerCard, cardArtMemo, resolveGameArt } from '../../src/library/LibraryGrid';
import { LibraryGameItem } from '../../src/library/libraryData';

describe('BannerCard Artwork Hierarchy & Memoization', () => {
    beforeEach(() => {
        cardArtMemo.clear();
    });

    const baseGame: LibraryGameItem = {
        appId: 99999,
        name: 'Hades',
        isShortcut: true,
        installed: true,
        running: false,
        playedMinutes: 120,
        achievements: null,
        heroic: null,
        source: 'Non-Steam',
    };

    it('immediately renders solid title on mount when no art is resolved or game has no art', () => {
        const game: LibraryGameItem = {
            ...baseGame,
            name: 'No Artwork Game',
        };

        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );

        expect(html).toContain('sgl-card-fallback-title');
        expect(html).toContain('No Artwork Game');
        expect(html).not.toContain('sgl-card-img');
    });

    it('resolveGameArt prioritizes Banner (Primary) over all other artwork', async () => {
        const game: LibraryGameItem = {
            ...baseGame,
            landscapeUrl: 'https://example.com/banner.jpg',
            heroUrl: 'https://example.com/hero.jpg',
            logoUrl: 'https://example.com/logo.png',
            capsuleUrl: 'https://example.com/poster.jpg',
        };

        const res = await resolveGameArt(game);
        expect(res).toEqual({ mode: 'banner', url: 'https://example.com/banner.jpg' });

        // Once resolved and stored in memo, BannerCard renders banner image directly
        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(html).toContain('sgl-card-img');
        expect(html).toContain('https://example.com/banner.jpg');
    });

    it('resolveGameArt prioritizes Hero + Logo (Option 1) when banner is absent', async () => {
        const game: LibraryGameItem = {
            ...baseGame,
            heroUrl: 'https://example.com/hero.jpg',
            logoUrl: 'https://example.com/logo.png',
            capsuleUrl: 'https://example.com/poster.jpg',
        };

        const res = await resolveGameArt(game);
        expect(res).toEqual({ mode: 'hero-logo', heroUrl: 'https://example.com/hero.jpg', logoUrl: 'https://example.com/logo.png' });

        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(html).toContain('sgl-card-fallback-bg');
        expect(html).toContain('sgl-card-fallback-logo');
        expect(html).toContain('https://example.com/hero.jpg');
        expect(html).toContain('https://example.com/logo.png');
        expect(html).not.toContain('https://example.com/poster.jpg');
    });

    it('resolveGameArt prioritizes Logo only (Option 2) when banner and hero are absent', async () => {
        const game: LibraryGameItem = {
            ...baseGame,
            logoUrl: 'https://example.com/logo.png',
            capsuleUrl: 'https://example.com/poster.jpg',
        };

        const res = await resolveGameArt(game);
        expect(res).toEqual({ mode: 'logo', logoUrl: 'https://example.com/logo.png' });

        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(html).toContain('sgl-card-fallback-logo');
        expect(html).toContain('https://example.com/logo.png');
        expect(html).not.toContain('sgl-card-fallback-bg');
        expect(html).not.toContain('https://example.com/poster.jpg');
    });

    it('resolveGameArt allows Poster (Option 3) ONLY when neither hero nor logo exists', async () => {
        const game: LibraryGameItem = {
            ...baseGame,
            capsuleUrl: 'https://example.com/poster.jpg',
        };

        const res = await resolveGameArt(game);
        expect(res).toEqual({ mode: 'poster', url: 'https://example.com/poster.jpg' });

        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(html).toContain('sgl-card-img');
        expect(html).toContain('https://example.com/poster.jpg');
    });

    it('memoizes resolved art so switching groups retains exact same art without re-resolving or race conditions', async () => {
        const game: LibraryGameItem = {
            ...baseGame,
            landscapeUrl: 'https://example.com/banner.jpg',
        };

        await resolveGameArt(game);
        expect(cardArtMemo.has(game.appId)).toBe(true);

        // Rendering with memoized art produces banner immediately on first frame
        const html = renderToString(
            <BannerCard
                game={game}
                isFocused={false}
                accent="#1a9fff"
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(html).toContain('https://example.com/banner.jpg');
    });

    it('applies sgl-card-uninstalled class and neutral gray accent when dimUninstalled is true and game is uninstalled', () => {
        const uninstalledGame: LibraryGameItem = {
            ...baseGame,
            installed: false,
        };

        const html = renderToString(
            <BannerCard
                game={uninstalledGame}
                isFocused={false}
                accent="#1a9fff"
                dimUninstalled={true}
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );

        expect(html).toContain('sgl-card-uninstalled');
        expect(html).toContain('--accent:#707784');
    });

    it('does not apply sgl-card-uninstalled when dimUninstalled is false or game is installed', () => {
        const installedGame: LibraryGameItem = {
            ...baseGame,
            installed: true,
        };

        const htmlInstalled = renderToString(
            <BannerCard
                game={installedGame}
                isFocused={false}
                accent="#1a9fff"
                dimUninstalled={true}
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(htmlInstalled).not.toContain('sgl-card-uninstalled');
        expect(htmlInstalled).toContain('--accent:#1a9fff');

        const uninstalledWithoutSetting = renderToString(
            <BannerCard
                game={{ ...baseGame, installed: false }}
                isFocused={false}
                accent="#1a9fff"
                dimUninstalled={false}
                onClick={() => {}}
                onDoubleClick={() => {}}
            />
        );
        expect(uninstalledWithoutSetting).not.toContain('sgl-card-uninstalled');
        expect(uninstalledWithoutSetting).toContain('--accent:#1a9fff');
    });

    describe('BannerCard index stability and React.memo equality', () => {
        // BannerCard is React.memo(component, arePropsEqual)
        const arePropsEqual = (BannerCard as unknown as { compare: (prev: unknown, next: unknown) => boolean }).compare;

        it('re-renders when index changes between categories or filters', () => {
            const prevProps = {
                game: baseGame,
                index: 2,
                isFocused: false,
                accent: '#1a9fff',
                dimUninstalled: true,
                onSelectGame: vi.fn(),
            };

            const nextProps = {
                ...prevProps,
                index: 5, // Moved to index 5 in new category
            };

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('re-renders when onSelectGame handler changes', () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            const prevProps = {
                game: baseGame,
                index: 3,
                isFocused: false,
                accent: '#1a9fff',
                dimUninstalled: true,
                onSelectGame: fn1,
            };

            const nextProps = {
                ...prevProps,
                onSelectGame: fn2,
            };

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('re-renders when onClick handler changes', () => {
            const prevProps = {
                game: baseGame,
                isFocused: false,
                accent: '#1a9fff',
                onClick: () => {},
            };
            const nextProps = {
                ...prevProps,
                onClick: () => {},
            };
            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('preserves memoization when index, focus, and game remain unchanged', () => {
            const onSelect = vi.fn();
            const prevProps = {
                game: baseGame,
                index: 4,
                isFocused: false,
                accent: '#1a9fff',
                dimUninstalled: true,
                onSelectGame: onSelect,
            };
            const nextProps = {
                ...prevProps,
            };
            expect(arePropsEqual(prevProps, nextProps)).toBe(true);
        });
    });
});


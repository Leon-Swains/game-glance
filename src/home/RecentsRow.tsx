import { Focusable } from '@decky/ui';
import type { GamepadEvent } from '@decky/ui';
import { memo, Ref, useMemo, useRef, useState } from 'react';
import { browserStores, capsuleUrls, heroUrls, landscapeUrls, useArtworkVersion } from './artwork';
import { wideArt } from './homeView';
import { clampFocus, isLibraryFocus, MAX_GHOSTS, RecentsGeometry, recentsLayout } from './recentsLayout';
import type { HomeGame } from './useHomeData';
import { tr } from '../i18n/steamText';

function urls(read: () => string[]): string[] {
    try {
        return read();
    } catch {
        return [];
    }
}

/** Several urls as stacked backgrounds: the first that exists paints over the rest (missing files draw nothing). */
function backgrounds(list: string[]): { backgroundImage?: string } {
    if (list.length === 0) return {};
    return { backgroundImage: list.map((u) => `url("${u.replace(/"/g, '%22')}")`).join(', ') };
}

/**
 * Blurred base, the sharp portrait capsule at the right, then `art` (the wide card's layers, on the expanded
 * capsule only; homeView.wideArt) mounted last so it sits on top and fades in over the portrait. The portrait
 * is never hidden: if every wide url fails to load, base plus portrait remain (the handoff's fallback).
 */
function CapsuleArt({ cover, art, blur }: { cover: string[]; art: string[] | null; blur: boolean }) {
    return (
        <>
            {blur && <div className="gh-cap-blur" style={backgrounds(cover.slice(0, 1))} />}
            <div className="gh-cap-cover" style={backgrounds(cover)} />
            {art && <div className="gh-cap-art" style={backgrounds(art)} />}
        </>
    );
}

/**
 * Whether card `i` draws its blurred base: only the selected card and the ones next to it. A narrow card's portrait is
 * exactly its width and covers the blur completely, so elsewhere it would only cost: every L1/R1 step slides every
 * card, and each blurred layer is re-composited (20 recents, 35 px blur docked). The neighbours keep theirs so the
 * card that is growing or shrinking during a step never shows a bare edge.
 */
export function capsuleBlur(i: number, selected: number): boolean {
    return Math.abs(i - selected) <= 1;
}

/** Helper to compute target card index change from drag offset in pixels. Pure. */
export function cardStepFromDrag(dragOffset: number, stepWidth: number): number {
    if (!Number.isFinite(dragOffset) || !Number.isFinite(stepWidth) || stepWidth <= 0) return 0;
    const threshold = Math.min(40, stepWidth * 0.25);
    if (Math.abs(dragOffset) < threshold) return 0;
    const stepCount = Math.max(1, Math.round(Math.abs(dragOffset) / (stepWidth * 0.75)));
    return dragOffset < 0 ? stepCount : -stepCount;
}

/** Determines if pointer movement qualifies as an intentional horizontal drag gesture. */
export function isDragGesture(deltaX: number, deltaY: number, threshold = 8): boolean {
    return Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY);
}

/** Determines step direction from wheel delta (+1 for forward/right/down, -1 for backward/left/up). */
export function wheelStep(delta: number, threshold = 15): -1 | 1 | 0 {
    if (!Number.isFinite(delta) || Math.abs(delta) < threshold) return 0;
    return delta > 0 ? 1 : -1;
}

/**
 * One recents card. Memoized on plain props, so an L1/R1 step re-renders only the cards whose place or state changed;
 * its art urls are read from Steam's stores only when the game or its expanded state changes.
 */
const GameCapsule = memo(function GameCapsule({
    game,
    left,
    width,
    dim,
    wide,
    blur,
    onClick,
}: {
    game: HomeGame;
    left: number;
    width: number;
    dim: boolean;
    wide: boolean;
    blur: boolean;
    onClick?: () => void;
}) {
    const artworkVersion = useArtworkVersion();
    const appId = game.appId;
    const cover = useMemo(() => urls(() => capsuleUrls(appId, browserStores)), [appId, artworkVersion]);
    const art = useMemo(
        () => (wide ? wideArt(urls(() => landscapeUrls(appId, browserStores)), urls(() => heroUrls(appId, browserStores)), cover) : null),
        [appId, wide, cover, artworkVersion],
    );
    return (
        <div
            className={`gh-cap${wide ? ' gh-cap-wide' : ''}`}
            style={{ left: `${left}px`, width: `${width}px`, opacity: dim ? 0.35 : 1 }}
            onClick={onClick}
            role="button"
            tabIndex={-1}
            aria-label={game.name}
        >
            <CapsuleArt cover={cover} art={art} blur={blur} />
            {/* A game new to the library (the "New to library" setting), as Steam's Home marks it. */}
            {game.isNew && <div className="gh-cap-new">{tr('newMark')}</div>}
            <div className="gh-cap-bar" />
        </div>
    );
});

/** The row's gamepad and mouse/touch handling, given by SpotlightHome (it owns the selection, bumpers, and pages to open). */
export interface RecentsRowNav {
    /** Takes focus when Home first gets focus (a cold start: the first game card, as on Steam's own Home). */
    preferred: boolean;
    setRef(el: HTMLDivElement | null): void;
    onFocus(): void;
    /** Left/Right, L1/R1, View/Menu (focusZones.recentsButton). */
    onButtonDown(evt: GamepadEvent): void;
    /** A: the selected game's page, or the Library on the Library card. */
    onActivate(): void;
    /** Selects a game or the Library card by index (mouse clicks, touch taps, mouse wheel, swipe gestures). */
    onSelect?(index: number): void;
}

/**
 * The recents row: games, then "View more in your Library", then the loop preview of the first games. One focusable for
 * the whole row (the cards slide by transform, so Steam's spatial navigation never moves between them): while it has
 * focus the selected card is highlighted, Left/Right select games and A opens the selected one (`nav`, from
 * SpotlightHome, which owns `selected`: it drives hero, title and actions; the row slides to follow).
 * Mouse and touch events are fully supported: clicking/tapping an unselected card selects it, clicking/tapping the
 * currently selected card opens/activates it, mouse wheel scrolls the carousel, and horizontal swipe/drag smoothly
 * tracks and snaps across items.
 */
export function RecentsRow({ games, selected, geometry, nav }: { games: HomeGame[]; selected: number; geometry: RecentsGeometry; nav: RecentsRowNav }) {
    const count = games.length;
    const at = clampFocus(count, selected);
    const layout = recentsLayout(count, at, geometry);
    const onLibrary = isLibraryFocus(count, at);
    const library = layout.items[count];
    // The loop preview's portraits, read once per list of games (not on every step).
    const ghostCovers = useMemo(() => games.slice(0, MAX_GHOSTS).map((g) => urls(() => capsuleUrls(g.appId, browserStores))), [games]);

    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const wasDragged = useRef(false);
    const lastWheelTime = useRef(0);

    const onPointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        wasDragged.current = false;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!pointerStart.current) return;
        const deltaX = e.clientX - pointerStart.current.x;
        const deltaY = e.clientY - pointerStart.current.y;

        if (!isDragging) {
            if (isDragGesture(deltaX, deltaY)) {
                setIsDragging(true);
                wasDragged.current = true;
                try {
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                } catch {
                    // Ignore capture errors in tests/mock environments
                }
            } else {
                return;
            }
        }

        let offset = deltaX;
        // Rubber-band resistance at bounds
        if (at === 0 && offset > 0) {
            offset *= 0.35;
        } else if (onLibrary && offset < 0) {
            offset *= 0.35;
        }
        setDragOffset(offset);
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (!pointerStart.current) return;
        pointerStart.current = null;

        if (isDragging) {
            setIsDragging(false);
            try {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
            } catch {
                // Ignore
            }

            const deltaX = dragOffset;
            setDragOffset(0);

            const step = cardStepFromDrag(deltaX, geometry.step);
            if (step !== 0) {
                const target = Math.min(count, Math.max(0, at + step));
                if (target !== at) {
                    nav.onSelect?.(target);
                }
            }

            setTimeout(() => {
                wasDragged.current = false;
            }, 120);
        } else {
            setDragOffset(0);
        }
    };

    const onPointerCancel = () => {
        pointerStart.current = null;
        if (isDragging) {
            setIsDragging(false);
            setDragOffset(0);
        }
    };

    const onWheel = (e: React.WheelEvent) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const step = wheelStep(delta);
        if (step === 0) return;

        const now = Date.now();
        if (now - lastWheelTime.current < 180) return;
        lastWheelTime.current = now;

        e.preventDefault?.();
        e.stopPropagation?.();

        const target = Math.min(count, Math.max(0, at + step));
        if (target !== at) {
            nav.onSelect?.(target);
        }
    };

    const handleCardClick = (index: number) => {
        if (wasDragged.current) return;
        if (index === at) {
            nav.onActivate();
        } else {
            nav.onSelect?.(index);
        }
    };

    const handleGhostClick = (ghostIndex: number) => {
        if (wasDragged.current) return;
        nav.onSelect?.(ghostIndex === 0 ? 0 : Math.min(count, ghostIndex));
    };

    return (
        <Focusable
            ref={nav.setRef as Ref<HTMLDivElement>}
            className={`gh-recents${isDragging ? ' gh-recents-dragging' : ''}`}
            focusClassName="gh-recents-focus"
            noFocusRing
            preferredFocus={nav.preferred}
            onFocus={nav.onFocus}
            onGamepadFocus={nav.onFocus}
            onButtonDown={nav.onButtonDown}
            onActivate={nav.onActivate}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onWheel={onWheel}
            role="listbox"
            aria-label={tr('recentGames')}
        >
            <div
                className="gh-recents-track"
                style={{
                    transform: `translateX(${layout.scrollX + dragOffset}px)`,
                    transition: isDragging ? 'none' : undefined,
                }}
            >
                {games.map((game, i) => (
                    <GameCapsule
                        key={game.appId}
                        game={game}
                        left={layout.items[i].left}
                        width={layout.items[i].width}
                        dim={layout.items[i].dim}
                        wide={!onLibrary && i === at}
                        blur={capsuleBlur(i, at)}
                        onClick={() => handleCardClick(i)}
                    />
                ))}
                <div
                    className={`gh-cap gh-cap-lib${onLibrary ? ' gh-cap-lib-on' : ''}`}
                    style={{ left: `${library.left}px`, width: `${library.width}px` }}
                    onClick={() => handleCardClick(count)}
                    role="button"
                    tabIndex={-1}
                    aria-label={tr('viewLibrary')}
                >
                    <div className="gh-lib-body">
                        <div className="gh-lib-grid">
                            <div className="gh-lib-cell gh-lib-cell-accent" />
                            <div className="gh-lib-cell" />
                            <div className="gh-lib-cell" />
                            <div className="gh-lib-cell" />
                        </div>
                        <div className="gh-lib-label">{tr('viewLibrary')}</div>
                    </div>
                    <div className="gh-cap-bar" />
                </div>
                {layout.ghosts.map((ghost, j) => (
                    <div
                        key={`ghost-${games[j].appId}`}
                        className="gh-cap gh-ghost"
                        aria-hidden="true"
                        style={{ left: `${ghost.left}px`, width: `${geometry.capsuleW}px`, opacity: ghost.opacity }}
                        onClick={() => handleGhostClick(j)}
                    >
                        {/* Cover only: a ghost is exactly the portrait's width, so a blur base would be fully hidden. */}
                        <div className="gh-cap-cover" style={backgrounds(ghostCovers[j] ?? [])} />
                        {j === 0 && (
                            <div className="gh-ghost-badge">
                                <div className="gh-ghost-icon">↻</div>
                                <div className="gh-ghost-label">BACK TO START</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Focusable>
    );
}

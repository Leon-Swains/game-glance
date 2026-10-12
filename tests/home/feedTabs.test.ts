import { describe, expect, it } from 'vitest';
import { ALL_TABS, FeedTabConfig } from '../../src/home/FeedSheet';
import { clampTab } from '../../src/home/homeMemory';
import { tabForButton } from '../../src/home/focusZones';

describe('feedTabs', () => {
    const BUMPER_LEFT = 5;
    const BUMPER_RIGHT = 6;

    it('ALL_TABS contains news, friends, recommended, and collections in order', () => {
        expect(ALL_TABS.map((t) => t.id)).toEqual(['news', 'friends', 'recommended', 'collections']);
        expect(ALL_TABS[0].label()).toBeTruthy();
        expect(ALL_TABS[1].label()).toBeTruthy();
        expect(ALL_TABS[2].label()).toBeTruthy();
        expect(ALL_TABS[3].label()).toBeTruthy();
    });

    it('filters tabs based on enabled settings', () => {
        const filter = (news: boolean, friends: boolean, recommended: boolean, collections: boolean): FeedTabConfig[] =>
            ALL_TABS.filter((t) => {
                if (t.id === 'news') return news;
                if (t.id === 'friends') return friends;
                if (t.id === 'recommended') return recommended;
                if (t.id === 'collections') return collections;
                return true;
            });

        // All enabled
        expect(filter(true, true, true, true).map((t) => t.id)).toEqual(['news', 'friends', 'recommended', 'collections']);

        // Friends disabled
        expect(filter(true, false, true, true).map((t) => t.id)).toEqual(['news', 'recommended', 'collections']);

        // Only Collections enabled
        expect(filter(false, false, false, true).map((t) => t.id)).toEqual(['collections']);

        // All disabled
        expect(filter(false, false, false, false)).toEqual([]);
    });

    it('clampTab safely bounds tab indices with dynamic tab counts', () => {
        // 3 tabs: 0..2
        expect(clampTab(0, 3)).toBe(0);
        expect(clampTab(1, 3)).toBe(1);
        expect(clampTab(2, 3)).toBe(2);
        expect(clampTab(5, 3)).toBe(2);

        // 2 tabs: 0..1
        expect(clampTab(0, 2)).toBe(0);
        expect(clampTab(1, 2)).toBe(1);
        expect(clampTab(2, 2)).toBe(1);

        // 1 tab: always 0
        expect(clampTab(0, 1)).toBe(0);
        expect(clampTab(1, 1)).toBe(0);
        expect(clampTab(3, 1)).toBe(0);

        // 0 tabs: always 0
        expect(clampTab(0, 0)).toBe(0);
        expect(clampTab(2, 0)).toBe(0);
    });

    it('tabForButton steps and bounds properly for various active tab counts', () => {
        // 1 tab: stays at 0
        expect(tabForButton(0, BUMPER_RIGHT, 1)).toBe(0);
        expect(tabForButton(0, BUMPER_LEFT, 1)).toBe(0);

        // 2 tabs: steps between 0 and 1, clamps at edges
        expect(tabForButton(0, BUMPER_RIGHT, 2)).toBe(1);
        expect(tabForButton(1, BUMPER_RIGHT, 2)).toBe(1);
        expect(tabForButton(1, BUMPER_LEFT, 2)).toBe(0);
        expect(tabForButton(0, BUMPER_LEFT, 2)).toBe(0);

        // 0 tabs: returns 0
        expect(tabForButton(0, BUMPER_RIGHT, 0)).toBe(0);
    });
});

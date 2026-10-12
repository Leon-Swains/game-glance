import { Component, ReactElement, ReactNode } from 'react';
import { LOG_PREFIX } from '../constants';
import { useSettings } from '../data/settings';
import { SpotlightLibrary } from './SpotlightLibrary';

let logged = false;

interface LibraryErrorBoundaryProps {
    fallback: ReactElement;
    children: ReactNode;
}

interface LibraryErrorBoundaryState {
    failed: boolean;
}

// Function constructor pattern compatible with both `new LibraryErrorBoundary(props)`
// and non-`new` invocations `LibraryErrorBoundary(props)` from foreign routers/bundles (e.g. Decky on CachyOS).
function LibraryErrorBoundary(this: any, props: LibraryErrorBoundaryProps) {
    if (!(this instanceof LibraryErrorBoundary)) {
        return new (LibraryErrorBoundary as any)(props);
    }
    Component.call(this, props);
    (this as any).state = { failed: false };
}

Object.setPrototypeOf(LibraryErrorBoundary.prototype, Component.prototype);
Object.setPrototypeOf(LibraryErrorBoundary, Component);
(LibraryErrorBoundary.prototype as any).isReactComponent = {};

(LibraryErrorBoundary as any).getDerivedStateFromError = () => {
    return { failed: true };
};

(LibraryErrorBoundary.prototype as any).componentDidCatch = (error: unknown) => {
    if (logged) return;
    logged = true;
    console.error(`${LOG_PREFIX} Spotlight Library render failed; showing Steam's Library`, error);
};

(LibraryErrorBoundary.prototype as any).render = function (this: any) {
    return this.state?.failed ? this.props.fallback : this.props.children;
};

const SafeLibraryErrorBoundary = LibraryErrorBoundary as unknown as new (
    props: LibraryErrorBoundaryProps
) => Component<LibraryErrorBoundaryProps, LibraryErrorBoundaryState>;

export function LibraryGate({ fallback }: { fallback: ReactElement }) {
    const settings = useSettings();
    if (!settings.spotlightLibrary) return fallback;

    return (
        <SafeLibraryErrorBoundary fallback={fallback}>
            <SpotlightLibrary />
        </SafeLibraryErrorBoundary>
    );
}

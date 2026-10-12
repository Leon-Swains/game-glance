import { Component, ReactNode } from 'react';
import { LOG_PREFIX } from '../constants';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    failed: boolean;
}

function ErrorBoundaryFn(this: any, props: ErrorBoundaryProps) {
    if (!(this instanceof ErrorBoundaryFn)) {
        return new (ErrorBoundaryFn as any)(props);
    }
    Component.call(this, props);
    (this as any).state = { failed: false };
}

Object.setPrototypeOf(ErrorBoundaryFn.prototype, Component.prototype);
Object.setPrototypeOf(ErrorBoundaryFn, Component);
(ErrorBoundaryFn.prototype as any).isReactComponent = {};

(ErrorBoundaryFn as any).getDerivedStateFromError = () => {
    return { failed: true };
};

(ErrorBoundaryFn.prototype as any).componentDidCatch = (error: unknown) => {
    console.error(`${LOG_PREFIX} game page render failed`, error);
};

(ErrorBoundaryFn.prototype as any).render = function (this: any) {
    return this.state?.failed ? null : this.props.children;
};

export const ErrorBoundary = ErrorBoundaryFn as unknown as new (
    props: ErrorBoundaryProps
) => Component<ErrorBoundaryProps, ErrorBoundaryState>;

// グローバルなReact型定義

import type * as React from 'react';

declare global {
  interface Window {
    React: {
      createElement: typeof React.createElement;
      useState: <S>(initialState: S | (() => S)) => [S, React.Dispatch<React.SetStateAction<S>>];
      useEffect: typeof React.useEffect;
    };
    ReactDOM: {
      createRoot: (container: Element | DocumentFragment) => {
        render: (children: React.ReactNode) => void;
      };
    };
    L: any;
    Chart: any;
    jsPDF: any;
    Papa: any;
  }
}

export {};

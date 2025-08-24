// Leaflet拡張の型定義
declare global {
  interface Window {
    L: typeof import('leaflet') & {
      heatLayer?: (data: [number, number, number][], options?: any) => any;
    };
    Chart: any;
    Papa: any;
    jsPDF: any;
  }
}

export {};

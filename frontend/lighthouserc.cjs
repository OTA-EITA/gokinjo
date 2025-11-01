// frontend/lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      // Vite のビルド成果物を指定
      staticDistDir: './dist',
      startServerCommand: 'node ./node_modules/http-server/bin/http-server ./dist -p 8080',
      url: ['http://localhost:8080/index.html'], // 明示的に指定
      // 実行回数の設定（デフォルト: CI環境3回、ローカル1回）
      // LHCI_RUNS=1 で明示的に1回実行も可能
      numberOfRuns: process.env.LHCI_RUNS 
        ? parseInt(process.env.LHCI_RUNS, 10) 
        : (process.env.CI ? 3 : 1),
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};

// frontend/lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      startServerCommand: 'node ./node_modules/http-server/bin/http-server ./dist -p 8080',
      url: ['http://localhost:8080/index.html'],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        throttlingMethod: 'simulate',
        // 高速化: 必要最小限の監査のみ
        onlyCategories: ['performance'],
        skipAudits: [
          'screenshot-thumbnails',
          'final-screenshot',
          'full-page-screenshot',
        ],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};

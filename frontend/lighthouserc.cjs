// frontend/lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      startServerCommand: 'node ./node_modules/http-server/bin/http-server ./dist -p 8080',
      url: ['http://localhost:8080/index.html'],
      // CI環境では1回のみ実行（高速化）
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        throttlingMethod: 'simulate',
        // スキップ可能な監査を無効化して高速化
        skipAudits: [
          'screenshot-thumbnails',
          'final-screenshot',
        ],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};

// ========== チャート関連機能 ==========

/**
 * チャートを作成/更新
 */
export const createOrUpdateChart = (
  canvasId: string, 
  type: string, 
  data: any, 
  options: any,
  chartInstances: Record<string, any>,
  setChartInstances: (updater: (prev: Record<string, any>) => Record<string, any>) => void
): void => {
  if (!(window as any).Chart) {
    console.warn('Chart.jsが読み込まれていません');
    return;
  }

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 既存のチャートを破棄
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  // 新しいチャートを作成
  const newChart = new (window as any).Chart(ctx, { type, data, options });
  setChartInstances(prev => ({ ...prev, [canvasId]: newChart }));
};

/**
 * 犯罪統計チャート設定
 */
export const getCrimeChartConfig = (crimeByCategory: Record<string, number>) => ({
  type: 'pie',
  data: {
    labels: Object.keys(crimeByCategory),
    datasets: [{
      data: Object.values(crimeByCategory),
      backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const }
    }
  }
});

/**
 * 安全スコア分布チャート設定
 */
export const getSafetyChartConfig = (safetyScoreDistribution: Record<string, number>) => ({
  type: 'bar',
  data: {
    labels: Object.keys(safetyScoreDistribution),
    datasets: [{
      label: '学校数',
      data: Object.values(safetyScoreDistribution),
      backgroundColor: ['#ff6b6b', '#feca57', '#f39c12', '#2ecc71', '#27ae60']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  }
});

/**
 * 学校種別チャート設定
 */
export const getSchoolTypeChartConfig = (schoolTypeDistribution: Record<string, number>, getSchoolTypeLabel: (type: string) => string) => ({
  type: 'doughnut',
  data: {
    labels: Object.keys(schoolTypeDistribution).map(k => getSchoolTypeLabel(k)),
    datasets: [{
      data: Object.values(schoolTypeDistribution),
      backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const }
    }
  }
});

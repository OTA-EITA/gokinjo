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

  // 既存のチャートを安全に破棄
  if (chartInstances[canvasId]) {
    try {
      chartInstances[canvasId].destroy();
    } catch (e) {
      console.warn(`チャート破棄エラー: ${canvasId}`, e);
    }
  }

  // Chart.jsのグローバルチャートインスタンスもクリア
  const Chart = (window as any).Chart;
  if (Chart.getChart) {
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
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
export const getSchoolTypeChartConfig = (schoolTypeDistribution: Record<string, number>, getSchoolTypeLabel: (type: any) => string) => ({
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

/**
 * エリア比較レーダーチャート設定
 */
export const getAreaComparisonRadarConfig = (areas: any[]) => {
  const colors = [
    { bg: 'rgba(24, 144, 255, 0.2)', border: 'rgba(24, 144, 255, 1)' },
    { bg: 'rgba(82, 196, 26, 0.2)', border: 'rgba(82, 196, 26, 1)' },
    { bg: 'rgba(250, 173, 20, 0.2)', border: 'rgba(250, 173, 20, 1)' },
    { bg: 'rgba(114, 46, 209, 0.2)', border: 'rgba(114, 46, 209, 1)' }
  ];

  const datasets = areas.map((area, index) => ({
    label: area.area_name,
    data: [
      area.avg_safety_score,
      area.school_count * 10, // スケール調整
      100 - (area.crime_count * 2), // 逆スケール（犯罪が少ないほど高スコア）
      100 - (area.crime_rate_per_school * 10), // 逆スケール
      (area.school_types.elementary + area.school_types.junior_high + area.school_types.high) * 5
    ],
    backgroundColor: colors[index % colors.length].bg,
    borderColor: colors[index % colors.length].border,
    borderWidth: 2,
    pointBackgroundColor: colors[index % colors.length].border,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: colors[index % colors.length].border
  }));

  return {
    type: 'radar',
    data: {
      labels: ['安全性', '学校数', '治安', '学校あたり犯罪', '教育環境'],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom' as const
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.r || 0;
              return `${label}: ${value.toFixed(1)}`;
            }
          }
        }
      }
    }
  };
};

/**
 * 時系列分析チャート設定（月別犯罪傾向）
 */
export const getMonthlyTrendConfig = (monthlyData: { month: string; count: number }[]) => ({
  type: 'line',
  data: {
    labels: monthlyData.map(d => d.month),
    datasets: [{
      label: '犯罪件数',
      data: monthlyData.map(d => d.count),
      borderColor: '#ff4d4f',
      backgroundColor: 'rgba(255, 77, 79, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }
});

/**
 * 曜日別分析チャート設定
 */
export const getWeekdayTrendConfig = (weekdayData: { day: string; count: number }[]) => ({
  type: 'bar',
  data: {
    labels: weekdayData.map(d => d.day),
    datasets: [{
      label: '犯罪件数',
      data: weekdayData.map(d => d.count),
      backgroundColor: [
        '#ff6b6b',
        '#4ecdc4',
        '#45b7d1',
        '#96ceb4',
        '#feca57',
        '#ff9ff3',
        '#a29bfe'
      ]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }
});

/**
 * 複数エリア比較バーチャート設定
 */
export const getAreaComparisonBarConfig = (areas: any[]) => ({
  type: 'bar',
  data: {
    labels: areas.map(a => a.area_name),
    datasets: [
      {
        label: '学校数',
        data: areas.map(a => a.school_count),
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        borderWidth: 1
      },
      {
        label: '犯罪件数',
        data: areas.map(a => a.crime_count),
        backgroundColor: '#ff6b6b',
        borderColor: '#ee5a6f',
        borderWidth: 1
      },
      {
        label: '安全スコア',
        data: areas.map(a => a.avg_safety_score),
        backgroundColor: '#1890ff',
        borderColor: '#0c7cd5',
        borderWidth: 1
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    }
  }
});

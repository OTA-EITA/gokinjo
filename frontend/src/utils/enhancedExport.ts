import * as XLSX from 'xlsx';
import { School, Crime, SafetyScore, StatisticsData } from '../types';
import { getSchoolTypeLabel, getPublicPrivateLabel, getSafetyLevelLabel } from './helpers';

/**
 * Excel詳細レポート生成
 */
export const generateExcelReport = (
  schools: School[],
  crimes: Crime[],
  safetyScores: SafetyScore[],
  statistics: StatisticsData,
  areaName: string
): void => {
  // ワークブック作成
  const workbook = XLSX.utils.book_new();

  // Sheet 1: サマリー
  addSummarySheet(workbook, statistics, areaName);

  // Sheet 2: 学校一覧
  addSchoolsSheet(workbook, schools, safetyScores);

  // Sheet 3: 犯罪一覧
  addCrimesSheet(workbook, crimes);

  // Sheet 4: 安全スコア分析
  addSafetyAnalysisSheet(workbook, schools, safetyScores);

  // Sheet 5: エリア統計
  addStatisticsSheet(workbook, statistics);

  // ファイルダウンロード
  const fileName = `${areaName || '東京都'}_学校安全レポート_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * サマリーシート追加
 */
const addSummarySheet = (
  workbook: XLSX.WorkBook,
  statistics: StatisticsData,
  areaName: string
): void => {
  const data = [
    ['学校・犯罪統計レポート'],
    ['エリア', areaName || '全域'],
    ['生成日時', new Date().toLocaleString('ja-JP')],
    [],
    ['概要'],
    ['総学校数', statistics.totalSchools],
    ['総犯罪件数', statistics.totalCrimes],
    ['平均安全スコア', statistics.averageSafetyScore.toFixed(1)],
    [],
    ['学校種別内訳'],
    ['小学校', statistics.schoolTypeDistribution.elementary || 0],
    ['中学校', statistics.schoolTypeDistribution.junior_high || 0],
    ['高校', statistics.schoolTypeDistribution.high || 0],
    [],
    ['犯罪種別内訳（上位5件）'],
    ...Object.entries(statistics.crimeByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => [category, count]),
    [],
    ['安全性評価'],
    ['Very Safe', statistics.safetyScoreDistribution.very_safe || 0],
    ['Safe', statistics.safetyScoreDistribution.safe || 0],
    ['Moderate', statistics.safetyScoreDistribution.moderate || 0],
    ['Caution', statistics.safetyScoreDistribution.caution || 0],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // スタイル設定（幅調整）
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'サマリー');
};

/**
 * 学校一覧シート追加
 */
const addSchoolsSheet = (
  workbook: XLSX.WorkBook,
  schools: School[],
  safetyScores: SafetyScore[]
): void => {
  const data = schools.map(school => {
    const safetyScore = safetyScores.find(s => s.school_id === school.id);
    
    return {
      '学校ID': school.id,
      '学校名': school.name,
      '種別': getSchoolTypeLabel(school.type),
      '公立/私立': getPublicPrivateLabel(school.public_private),
      '住所': school.address || '',
      '緯度': school.latitude?.toFixed(6) || '',
      '経度': school.longitude?.toFixed(6) || '',
      '安全スコア': safetyScore?.score.toFixed(1) || 'N/A',
      '安全レベル': safetyScore ? getSafetyLevelLabel(safetyScore.score_level) : 'N/A',
      '周辺犯罪件数': safetyScore?.crime_count || 0,
      '調査半径(m)': safetyScore?.radius_meters || 500
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // 列幅調整
  worksheet['!cols'] = [
    { wch: 8 },  // ID
    { wch: 30 }, // 学校名
    { wch: 10 }, // 種別
    { wch: 12 }, // 公立/私立
    { wch: 40 }, // 住所
    { wch: 12 }, // 緯度
    { wch: 12 }, // 経度
    { wch: 12 }, // 安全スコア
    { wch: 15 }, // 安全レベル
    { wch: 15 }, // 周辺犯罪件数
    { wch: 12 }  // 調査半径
  ];

  // フィルター有効化
  worksheet['!autofilter'] = { ref: `A1:K${data.length + 1}` };

  XLSX.utils.book_append_sheet(workbook, worksheet, '学校一覧');
};

/**
 * 犯罪一覧シート追加
 */
const addCrimesSheet = (
  workbook: XLSX.WorkBook,
  crimes: Crime[]
): void => {
  const data = crimes.map(crime => ({
    '犯罪ID': crime.id,
    '種別': crime.category,
    '発生日': crime.date,
    '緯度': crime.latitude?.toFixed(6) || '',
    '経度': crime.longitude?.toFixed(6) || '',
    '詳細': crime.description || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // 列幅調整
  worksheet['!cols'] = [
    { wch: 10 }, // ID
    { wch: 15 }, // 種別
    { wch: 12 }, // 発生日
    { wch: 12 }, // 緯度
    { wch: 12 }, // 経度
    { wch: 50 }  // 詳細
  ];

  // フィルター有効化
  worksheet['!autofilter'] = { ref: `A1:F${data.length + 1}` };

  XLSX.utils.book_append_sheet(workbook, worksheet, '犯罪一覧');
};

/**
 * 安全スコア分析シート追加
 */
const addSafetyAnalysisSheet = (
  workbook: XLSX.WorkBook,
  schools: School[],
  safetyScores: SafetyScore[]
): void => {
  // 安全スコア順にソート
  const sortedSchools = schools
    .map(school => {
      const safetyScore = safetyScores.find(s => s.school_id === school.id);
      return {
        school,
        safetyScore: safetyScore?.score || 0,
        crimeCount: safetyScore?.crime_count || 0,
        scoreLevel: safetyScore?.score_level || 'N/A'
      };
    })
    .sort((a, b) => b.safetyScore - a.safetyScore);

  const data = sortedSchools.map((item, index) => ({
    '順位': index + 1,
    '学校名': item.school.name,
    '種別': getSchoolTypeLabel(item.school.type),
    '安全スコア': item.safetyScore.toFixed(1),
    '安全レベル': getSafetyLevelLabel(item.scoreLevel as any),
    '周辺犯罪件数': item.crimeCount,
    '住所': item.school.address || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // 列幅調整
  worksheet['!cols'] = [
    { wch: 6 },  // 順位
    { wch: 30 }, // 学校名
    { wch: 10 }, // 種別
    { wch: 12 }, // 安全スコア
    { wch: 15 }, // 安全レベル
    { wch: 15 }, // 周辺犯罪件数
    { wch: 40 }  // 住所
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '安全スコア分析');
};

/**
 * 統計シート追加
 */
const addStatisticsSheet = (
  workbook: XLSX.WorkBook,
  statistics: StatisticsData
): void => {
  const data: any[] = [
    ['統計カテゴリ', '項目', '値'],
    [],
    ['基本統計', '総学校数', statistics.totalSchools],
    ['', '総犯罪件数', statistics.totalCrimes],
    ['', '平均安全スコア', statistics.averageSafetyScore.toFixed(1)],
    [],
    ['学校種別', '小学校', statistics.schoolTypeDistribution.elementary || 0],
    ['', '中学校', statistics.schoolTypeDistribution.junior_high || 0],
    ['', '高校', statistics.schoolTypeDistribution.high || 0],
    [],
    ['犯罪種別', '', ''],
    ...Object.entries(statistics.crimeByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ['', category, count]),
    [],
    ['安全性分布', 'Very Safe', statistics.safetyScoreDistribution.very_safe || 0],
    ['', 'Safe', statistics.safetyScoreDistribution.safe || 0],
    ['', 'Moderate', statistics.safetyScoreDistribution.moderate || 0],
    ['', 'Caution', statistics.safetyScoreDistribution.caution || 0]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 列幅調整
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'エリア統計');
};

/**
 * 地図画像付きPDF生成（改善版）
 */
export const generateEnhancedPDF = async (
  statistics: StatisticsData,
  areaName: string,
  mapElement?: HTMLElement
): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = await import('html2canvas');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // タイトル
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${areaName} 学校安全レポート`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // 生成日時
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, yPosition);
  yPosition += 15;

  // サマリー
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('サマリー', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryLines = [
    `総学校数: ${statistics.totalSchools}校`,
    `総犯罪件数: ${statistics.totalCrimes}件`,
    `平均安全スコア: ${statistics.averageSafetyScore.toFixed(1)}`
  ];

  summaryLines.forEach(line => {
    doc.text(line, 25, yPosition);
    yPosition += 7;
  });

  // 地図画像（オプション）
  if (mapElement) {
    try {
      yPosition += 10;
      const canvas = await html2canvas.default(mapElement, {
        useCORS: true,
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 新しいページに地図を追加
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('エリアマップ', 20, 20);
      doc.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    } catch (error) {
      console.error('Failed to capture map image:', error);
    }
  }

  // PDFダウンロード
  const fileName = `${areaName}_学校安全レポート_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

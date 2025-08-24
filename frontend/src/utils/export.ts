import { School, Crime, SafetyScore, StatisticsData } from '@/types';
import { getSchoolTypeLabel } from '@/utils/helpers';

// ========== エクスポート機能 ==========

/**
 * CSVデータを生成
 */
export const generateCSVData = (schools: School[], crimes: Crime[], safetyScores: SafetyScore[]): string => {
  const csvData = [
    ['Type', 'Name', 'Category', 'Date', 'Latitude', 'Longitude', 'SafetyScore'],
    // 学校データ
    ...schools.map(school => {
      const safetyScore = safetyScores.find(s => s.school_id === school.id);
      return ['School', school.name, getSchoolTypeLabel(school.type), '', 
              school.latitude, school.longitude, safetyScore?.score || ''];
    }),
    // 犯罪データ
    ...crimes.map(crime => 
      ['Crime', '', crime.category, crime.date, crime.latitude, crime.longitude, '']
    )
  ];
  
  return (window as any).Papa?.unparse ? (window as any).Papa.unparse(csvData) : 
         csvData.map(row => row.join(',')).join('\n');
};

/**
 * PDFレポートを生成
 */
export const generatePDFReport = (statistics: StatisticsData, areaName: string): void => {
  if (!(window as any).jsPDF) {
    alert('PDF生成ライブラリが読み込まれていません');
    return;
  }
  
  const { jsPDF } = (window as any);
  const doc = new jsPDF();
  
  // タイトル
  doc.setFontSize(20);
  doc.text('近隣情報マッピング - 統計レポート', 20, 30);
  doc.setFontSize(14);
  doc.text(`エリア: ${areaName || '全体'}`, 20, 45);
  doc.text(`生成日: ${new Date().toLocaleDateString('ja-JP')}`, 20, 60);
  
  let yPos = 80;
  
  // 犯罪種別統計
  doc.setFontSize(16);
  doc.text('犯罪種別統計', 20, yPos);
  yPos += 20;
  doc.setFontSize(12);
  Object.entries(statistics.crimeByCategory).forEach(([category, count]) => {
    doc.text(`${category}: ${count}件`, 25, yPos);
    yPos += 15;
  });
  
  yPos += 10;
  
  // 安全スコア分布
  doc.setFontSize(16);
  doc.text('安全スコア分布', 20, yPos);
  yPos += 20;
  doc.setFontSize(12);
  Object.entries(statistics.safetyScoreDistribution).forEach(([range, count]) => {
    doc.text(`${range}点: ${count}校`, 25, yPos);
    yPos += 15;
  });
  
  // PDFをダウンロード
  doc.save(`neighborhood_mapping_report_${new Date().getTime()}.pdf`);
};

/**
 * CSVファイルをダウンロード
 */
export const downloadCSV = (csvContent: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `neighborhood_mapping_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

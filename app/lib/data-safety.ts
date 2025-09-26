import { ProjectData } from '@/types';
import { sampleProjectData } from './sample-data';

/**
 * 數據安全工具 - 防止意外的數據丟失
 */

// 檢查數據是否為空或無效
export function isEmptyData(data: ProjectData): boolean {
  return data.projects.length === 0 && data.passwords.length === 0;
}

// 檢查是否為首次部署（沒有任何數據）
export function isFirstDeploy(data: ProjectData): boolean {
  return isEmptyData(data) && data.metadata.version === '1.0.0';
}

// 安全的數據合併 - 用於恢復或升級
export function safeMergeData(existingData: ProjectData, newData: ProjectData): ProjectData {
  // 保留現有的專案，只添加新的
  const existingProjectIds = new Set(existingData.projects.map(p => p.id));
  const newProjects = newData.projects.filter(p => !existingProjectIds.has(p.id));

  // 保留現有的密碼，只添加新的
  const existingPasswordIds = new Set(existingData.passwords.map(p => p.id));
  const newPasswords = newData.passwords.filter(p => !existingPasswordIds.has(p.id));

  return {
    projects: [...existingData.projects, ...newProjects],
    passwords: [...existingData.passwords, ...newPasswords],
    settings: {
      ...existingData.settings,
      ...newData.settings
    },
    metadata: {
      ...newData.metadata,
      lastUpdated: Date.now(),
      totalProjects: existingData.projects.length + newProjects.length,
      publicProjects: [...existingData.projects, ...newProjects].filter(p => 
        p.visibility.description && p.category !== 'abandoned'
      ).length
    }
  };
}

// 創建帶有時間戳的備份數據
export function createBackupData(data: ProjectData): ProjectData {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      backupTimestamp: Date.now(),
      backupReason: 'Pre-update backup'
    }
  };
}

// 驗證數據完整性
export function validateDataIntegrity(data: ProjectData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('數據對象為空');
    return { isValid: false, errors };
  }

  if (!Array.isArray(data.projects)) {
    errors.push('專案數據不是陣列格式');
  }

  if (!Array.isArray(data.passwords)) {
    errors.push('密碼數據不是陣列格式');
  }

  if (!data.settings) {
    errors.push('設定數據丟失');
  }

  if (!data.metadata) {
    errors.push('元數據丟失');
  }

  // 檢查專案數據完整性
  data.projects?.forEach((project, index) => {
    if (!project.id || !project.dateAndFileName || !project.description) {
      errors.push(`專案 ${index + 1} 缺少必要欄位`);
    }
    if (!project.visibility || typeof project.visibility !== 'object') {
      errors.push(`專案 ${index + 1} 缺少可見性設定`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 生成系統狀態報告
export function generateSystemReport(data: ProjectData): string {
  const { isValid, errors } = validateDataIntegrity(data);
  
  const report = `
專案展示平台系統報告
==================
時間: ${new Date().toLocaleString()}
版本: ${data.metadata?.version || '未知'}

數據統計:
- 總專案數: ${data.projects?.length || 0}
- 公開專案數: ${data.metadata?.publicProjects || 0}
- 密碼數量: ${data.passwords?.length || 0}
- 最後更新: ${data.metadata?.lastUpdated ? new Date(data.metadata.lastUpdated).toLocaleString() : '未知'}

數據完整性: ${isValid ? '✅ 正常' : '❌ 有問題'}
${errors.length > 0 ? '問題列表:\n' + errors.map(e => `- ${e}`).join('\n') : ''}

專案類別分布:
- 重要專案: ${data.projects?.filter(p => p.category === 'important').length || 0}
- 次要專案: ${data.projects?.filter(p => p.category === 'secondary').length || 0}
- 實踐專案: ${data.projects?.filter(p => p.category === 'practice').length || 0}
- 已完成: ${data.projects?.filter(p => p.category === 'completed').length || 0}
- 已捨棄: ${data.projects?.filter(p => p.category === 'abandoned').length || 0}
`;

  return report.trim();
}

'use client';

import { useState } from 'react';
import { PasswordEntry, PasswordFormData } from '@/types';
import { generateId } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  PlusIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  PencilIcon, 
  TrashIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

interface PasswordSectionProps {
  passwords: PasswordEntry[];
  showPasswords: boolean;
  onUpdate: (passwords: PasswordEntry[]) => void;
}

export function PasswordSection({ passwords, showPasswords, onUpdate }: PasswordSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PasswordFormData>({
    platform: '',
    account: '',
    password: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform.trim() || !formData.account.trim() || !formData.password.trim()) {
      showToast('error', '請填寫所有欄位');
      return;
    }

    try {
      let updatedPasswords: PasswordEntry[];
      
      if (editingId) {
        // 編輯現有密碼
        updatedPasswords = passwords.map(p => 
          p.id === editingId 
            ? {
                ...p,
                platform: formData.platform.trim(),
                account: formData.account.trim(),
                password: formData.password.trim(),
                updatedAt: Date.now()
              }
            : p
        );
      } else {
        // 新增密碼
        const newPassword: PasswordEntry = {
          id: generateId(),
          platform: formData.platform.trim(),
          account: formData.account.trim(),
          password: formData.password.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        updatedPasswords = [...passwords, newPassword];
      }
      
      // TODO: 同步到伺服器
      // await updatePasswordsOnServer(updatedPasswords);
      
      onUpdate(updatedPasswords);
      
      showToast('success', editingId ? '密碼更新成功' : '密碼新增成功');
      
      // 重置表單
      setFormData({ platform: '', account: '', password: '' });
      setIsAdding(false);
      setEditingId(null);
    } catch (error) {
      showToast('error', '保存失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  const handleEdit = (password: PasswordEntry) => {
    setFormData({
      platform: password.platform,
      account: password.account,
      password: password.password
    });
    setEditingId(password.id);
    setIsAdding(true);
  };

  const handleDelete = (passwordId: string) => {
    const updatedPasswords = passwords.filter(p => p.id !== passwordId);
    onUpdate(updatedPasswords);
    showToast('success', '密碼刪除成功');
    setDeleteConfirm(null);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', '已複製到剪貼板');
    } catch (error) {
      showToast('error', '複製失敗');
    }
  };

  const handleCancel = () => {
    setFormData({ platform: '', account: '', password: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">密碼管理</h2>
        <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
          ❗ 僅管理員可見
        </div>
      </div>

      {/* 新增/編輯表單 */}
      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {editingId ? '編輯密碼' : '新增密碼'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  平台
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="input"
                  placeholder="如: Paddle, Auth0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  帳號
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="input"
                  placeholder="電子郵件或用戶名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密碼
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="密碼"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? '更新' : '新增'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 新增按鈕 */}
      {!isAdding && (
        <div className="mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>新增密碼</span>
          </button>
        </div>
      )}

      {/* 密碼列表 */}
      {passwords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂無儲存的密碼
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  帳號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  密碼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {passwords.map((password) => (
                <tr key={password.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {password.platform}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{password.account}</span>
                      <button
                        onClick={() => handleCopy(password.account)}
                        className="text-gray-400 hover:text-gray-600"
                        title="複製帳號"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showPasswords ? password.password : '•'.repeat(12)}
                      </span>
                      <button
                        onClick={() => handleCopy(password.password)}
                        className="text-gray-400 hover:text-gray-600"
                        title="複製密碼"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(password.updatedAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(password)}
                        className="text-primary-600 hover:text-primary-700"
                        title="編輯"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      {deleteConfirm === password.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(password.id)}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 bg-gray-50 rounded"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(password.id)}
                          className="text-red-600 hover:text-red-700"
                          title="刪除"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

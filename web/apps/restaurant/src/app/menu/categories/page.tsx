'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FolderTree, ChevronRight, ChevronDown, Pencil, Trash2,
  GripVertical, Eye, EyeOff, Search, MoreHorizontal, Tag
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  itemCount: number;
  isVisible: boolean;
  children?: Category[];
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/menu/categories');
      setCategories(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Không thể tải danh mục');
    } finally { setIsLoading(false); }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/menu/categories', { name: newName.trim(), icon: newIcon });
      setNewName('');
      setNewIcon('🍽️');
      setShowAddForm(false);
      await fetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Không thể tạo danh mục');
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.patch(`/menu/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      await fetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Không thể đổi tên danh mục');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa danh mục này? Các món sẽ được chuyển vào "Chưa phân loại".')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      await fetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Không thể xóa danh mục');
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      await api.patch(`/menu/categories/${id}/visibility`);
      await fetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Không thể thay đổi hiển thị');
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const EMOJIS = ['🍽️', '🍜', '🥗', '🥤', '🍰', '🍕', '🍔', '🍱', '☕', '🍺'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton" />
        <div className="h-10 w-64 skeleton" />
        {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <FolderTree className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Danh mục món</h1>
            <p className="text-sm text-gray-500">{categories.length} danh mục</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/menu')}
            className="btn-ghost text-sm"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Quản lý món
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm danh mục..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card mb-4 border-brand-200 bg-brand-50">
          <div className="flex items-end gap-3">
            <div>
              <label className="label">Tên danh mục</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="input-field"
                placeholder="vd: Món chính"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="label">Icon</label>
              <div className="flex gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewIcon(emoji)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors',
                      newIcon === emoji ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-gray-100'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary">Tạo</button>
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Category list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
            <FolderTree className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có danh mục nào</h3>
          <p className="text-sm text-gray-500 mb-4">Tạo danh mục đầu tiên để bắt đầu sắp xếp thực đơn</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm danh mục
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(cat => (
            <div key={cat.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 group">
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  {expandedIds.has(cat.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                <span className="text-xl">{cat.icon || '📁'}</span>

                {editingId === cat.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(cat.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="input-field flex-1 max-w-xs"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900 flex-1">{cat.name}</span>
                )}

                <span className="badge bg-gray-100 text-gray-600 border-gray-200">
                  {cat.itemCount} món
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleVisibility(cat.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      cat.isVisible ? 'hover:bg-green-50 text-green-600' : 'hover:bg-gray-100 text-gray-400'
                    )}
                    title={cat.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                  >
                    {cat.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editingId === cat.id && (
                <div className="flex gap-2 mt-2 ml-16">
                  <button onClick={() => handleRename(cat.id)} className="btn-primary text-xs py-1">
                    Lưu
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost text-xs py-1">
                    Hủy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

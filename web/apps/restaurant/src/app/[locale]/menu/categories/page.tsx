'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { ArrowLeft, Plus, FolderTree } from 'lucide-react';
import { CategoryTree } from '@/components/menu/category-tree';
import { api } from '@/lib/api';
import type { MenuCategory } from '@/lib/types';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📁');

  const fetchCategories = async () => {
    try {
      const data = await api.get<MenuCategory[]>('/restaurant/menu/categories');
      setCategories(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/restaurant/menu/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || 'Xoá thất bại');
    }
  };

  const handleSaveNew = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await api.post<MenuCategory>('/restaurant/menu/categories', {
        name: newCatName.trim(),
        icon: newCatIcon,
      });
      setCategories([...categories, cat]);
      setShowAddDialog(false);
      setNewCatName('');
      setNewCatIcon('📁');
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || 'Thêm danh mục thất bại');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/restaurant/menu/categories/${id}`, { name: editName.trim(), icon: editIcon });
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: editName.trim(), icon: editIcon } : c));
      setEditingId(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || 'Cập nhật thất bại');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push('/menu')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại thực đơn
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <FolderTree className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Danh mục</h1>
            <p className="text-sm text-gray-500">Quản lý danh mục món ăn</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowAddDialog(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4 mr-1" />
          Thêm danh mục
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      <div className="card">
        <CategoryTree
          categories={categories}
          onEdit={(id) => {
            const cat = categories.find((c) => c.id === id);
            if (cat) { setEditingId(id); setEditName(cat.name); setEditIcon(cat.icon); }
          }}
          onDelete={handleDelete}
          onToggleVisibility={async (id) => {
            const cat = categories.find((c) => c.id === id);
            if (!cat) return;
            await api.patch(`/restaurant/menu/categories/${id}`, { isVisible: !cat.isVisible });
            setCategories((prev) => prev.map((c) => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
          }}
          onAdd={() => setShowAddDialog(true)}
        />
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Thêm danh mục mới</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Biểu tượng</label>
                <input type="text" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="input-field text-lg text-center" maxLength={2} />
              </div>
              <div>
                <label className="label">Tên danh mục</label>
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field" placeholder="VD: Món chính" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button type="button" onClick={() => setShowAddDialog(false)} className="btn-ghost text-sm">Huỷ</button>
              <button type="button" onClick={handleSaveNew} className="btn-primary text-sm">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sửa danh mục</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Biểu tượng</label>
                <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="input-field text-lg text-center" maxLength={2} />
              </div>
              <div>
                <label className="label">Tên danh mục</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-sm">Huỷ</button>
              <button type="button" onClick={() => handleUpdate(editingId)} className="btn-primary text-sm">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FolderTree, Pencil, Trash2, Save, X, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CategoryDetail {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  items: { id: string; name: string; price: number; image: string }[];
}

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get<CategoryDetail>(`/menu/categories/${id}`);
        setCategory(data);
        setEditName(data.name);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Không tìm thấy danh mục');
      } finally { setIsLoading(false); }
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!editName.trim() || !category) return;
    try {
      const updated = await api.patch<CategoryDetail>(`/menu/categories/${id}`, { name: editName.trim() });
      setCategory(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể cập nhật');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton" />
        <div className="card h-24" />
        <div className="card h-64" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy danh mục</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => router.push('/menu/categories')} className="btn-primary">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => router.push('/menu/categories')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại danh mục
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
          <span className="text-2xl">{category.icon || '📁'}</span>
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="input-field max-w-xs text-xl font-bold"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
              />
              <button onClick={handleSave} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><Save className="h-4 w-4" /></button>
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-500">{category.itemCount} món trong danh mục</p>
            </>
          )}
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-ghost">
            <Pencil className="h-4 w-4 mr-1.5" />
            Đổi tên
          </button>
        )}
      </div>

      {category.items.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chưa có món nào trong danh mục này</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Các món trong danh mục</h3>
          <div className="divide-y divide-gray-100">
            {category.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <Tag className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 flex-1">{item.name}</span>
                <span className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN')}₫</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

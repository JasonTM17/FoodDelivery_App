import { AlertCircle, ToggleLeft, ToggleRight, UserCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CUISINE_OPTIONS = [
  'Việt Nam', 'Trung Hoa', 'Nhật Bản', 'Hàn Quốc', 'Thái Lan',
  'Ý', 'Fastfood', 'Chay', 'Hải sản', 'Lẩu', 'Nướng', 'Bánh mì',
];

export function ProfileHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
        <UserCircle className="h-5 w-5 text-brand-600" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hồ sơ nhà hàng</h1>
        <p className="text-sm text-gray-500">Thông tin hiển thị cho khách hàng</p>
      </div>
    </div>
  );
}

export function AlertMessage({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
    </>
  );
}

export function BasicInfoFields({
  values,
  setters,
  cuisines,
  onToggleCuisine,
}: {
  values: { name: string; description: string; address: string; phone: string };
  setters: {
    setName: (value: string) => void;
    setDescription: (value: string) => void;
    setAddress: (value: string) => void;
    setPhone: (value: string) => void;
  };
  cuisines: string[];
  onToggleCuisine: (cuisine: string) => void;
}) {
  return (
    <div className="card mb-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h2>
      <TextField label="Tên nhà hàng" value={values.name} onChange={setters.setName} required />
      <div>
        <label className="label">Mô tả</label>
        <textarea value={values.description} onChange={event => setters.setDescription(event.target.value)} rows={3} className="input-field resize-none" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Địa chỉ" value={values.address} onChange={setters.setAddress} required />
        <TextField label="Số điện thoại" value={values.phone} onChange={setters.setPhone} type="tel" required />
      </div>
      <CuisinePicker cuisines={cuisines} onToggleCuisine={onToggleCuisine} />
    </div>
  );
}

export function OperationsFields({
  minOrder,
  isOpen,
  setMinOrder,
  setIsOpen,
}: {
  minOrder: string;
  isOpen: boolean;
  setMinOrder: (value: string) => void;
  setIsOpen: (value: boolean) => void;
}) {
  return (
    <div className="card mb-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Thiết lập vận hành</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Đơn tối thiểu (đ)" value={minOrder} onChange={setMinOrder} type="number" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
        <div><p className="text-sm font-medium text-gray-900">Nhận đơn</p><p className="text-xs text-gray-500">Bật để nhà hàng hiển thị và nhận đơn mới</p></div>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? <ToggleRight className="h-8 w-8 text-brand-500" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      <div className="skeleton mb-6 h-48 w-full rounded-xl" />
      <div className="card max-w-2xl space-y-4">
        {[1, 2, 3, 4].map(item => (
          <div key={item}><div className="skeleton mb-2 h-4 w-24" /><div className="skeleton h-10 w-full rounded-lg" /></div>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = 'text', required = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return <div><label className="label">{label}</label><input type={type} value={value} onChange={event => onChange(event.target.value)} className="input-field" required={required} /></div>;
}

function CuisinePicker({ cuisines, onToggleCuisine }: { cuisines: string[]; onToggleCuisine: (cuisine: string) => void }) {
  return (
    <div>
      <label className="label">Ẩm thực</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {CUISINE_OPTIONS.map(cuisine => (
          <button key={cuisine} type="button" onClick={() => onToggleCuisine(cuisine)}
            className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', cuisines.includes(cuisine) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-gray-600 hover:border-brand-300 hover:text-brand-600')}
          >
            {cuisines.includes(cuisine) && <X className="mr-1 inline h-3 w-3" />}{cuisine}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiPost } from '@/lib/api';
import { Loader2, UtensilsCrossed, AlertTriangle, XCircle } from 'lucide-react';

const MAX_FAIL = 5;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLocked = failCount >= MAX_FAIL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);

    try {
      const res = await apiPost<{
        accessToken: string
        refreshToken: string
        user: { name: string; email: string; role: string }
      }>('/auth/admin/login', { email, password });

      localStorage.setItem('admin_token', res.accessToken);
      localStorage.setItem('admin_refresh_token', res.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      if (rememberMe) localStorage.setItem('admin_remember_email', email);
      router.replace('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
      setFailCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">FoodFlow Admin</CardTitle>
          <CardDescription>Đăng nhập để quản lý hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {isLocked && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tài khoản tạm khóa sau {MAX_FAIL} lần đăng nhập sai.
                Vui lòng thử lại sau 15 phút hoặc liên hệ quản trị viên.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@foodflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isLocked}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isLocked}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={loading || isLocked}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                Ghi nhớ đăng nhập
              </Label>
            </div>

            {error && !isLocked && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || isLocked}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : isLocked ? (
                'Tài khoản tạm khóa'
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

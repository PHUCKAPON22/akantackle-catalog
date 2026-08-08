import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/admin/LoginForm'
import { Dashboard } from '@/components/admin/Dashboard'
import { Button } from '@/components/ui/Button'

export function AdminPage() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()

  async function handleSignIn(email: string, password: string) {
    const error = await signIn(email, password)
    if (!error) return null
    if (error.message.includes('Invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    return error.message
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  if (!session) {
    return <LoginForm onSignIn={handleSignIn} />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-400">
          <ShieldAlert size={20} />
        </div>
        <h1 className="font-display text-lg font-semibold text-white">บัญชีนี้ไม่มีสิทธิ์เข้าถึงหลังบ้าน</h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ admin ให้กับบัญชีนี้
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>
          ออกจากระบบ
        </Button>
      </div>
    )
  }

  return <Dashboard onSignOut={signOut} />
}

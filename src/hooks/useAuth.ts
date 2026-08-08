import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  isAdmin: boolean
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    let active = true

    async function checkAdmin(session: Session | null) {
      if (!session) {
        if (active) setState({ session: null, isAdmin: false, loading: false })
        return
      }
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (active) setState({ session, isAdmin: !!data, loading: false })
    }

    supabase.auth.getSession().then(({ data }) => checkAdmin(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, loading: true }))
      checkAdmin(session)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}

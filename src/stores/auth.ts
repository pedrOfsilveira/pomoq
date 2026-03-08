import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const profile = ref<{
    id: string
    email: string
    display_name: string | null
    avatar_url: string | null
    default_questions_per_block: number
    default_disciplines: string[]
  } | null>(null)

  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const displayName = computed(
    () => profile.value?.display_name || user.value?.email?.split('@')[0] || 'Estudante',
  )
  const avatarUrl = computed(
    () => profile.value?.avatar_url || user.value?.user_metadata?.avatar_url || null,
  )

  function initialize() {
    if (initPromise) return initPromise
    initPromise = doInitialize().catch((error) => {
      console.error('[auth] initialize failed:', error)
      session.value = null
      user.value = null
      profile.value = null
    })
    return initPromise
  }

  /** Wait until auth has finished initialising. Safe to call multiple times. */
  async function waitForAuth() {
    await initialize()
  }

  async function doInitialize() {
    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null

      if (user.value) {
        await fetchProfile()
      }

      // Listen for auth changes (token refresh, sign-in/out from other tabs, etc.)
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        try {
          session.value = newSession
          user.value = newSession?.user ?? null

          if (user.value) {
            await fetchProfile()
          } else {
            profile.value = null
          }
        } catch (error) {
          console.error('[auth] state change handling failed:', error)
        }
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .limit(1)

      if (!error && data && data.length > 0) {
        profile.value = data[0] as typeof profile.value
      } else if (!error && (!data || data.length === 0)) {
        // Profile doesn't exist yet — create it (trigger may have missed)
        const meta = user.value.user_metadata ?? {}
        const { data: created, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: user.value.id,
            email: user.value.email ?? '',
            display_name: meta.full_name ?? meta.name ?? user.value.email?.split('@')[0] ?? null,
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
          })
          .select()
          .limit(1)

        if (!insertErr && created && created.length > 0) {
          profile.value = created[0] as typeof profile.value
        }
      }
    } catch (error) {
      console.error('[auth] fetchProfile failed:', error)
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
    user.value = null
    session.value = null
    profile.value = null
    // Reset cached init promise so the next login starts fresh
    initPromise = null
  }

  async function updateProfile(updates: {
    display_name?: string
    default_questions_per_block?: number
    default_disciplines?: string[]
  }) {
    if (!user.value) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('Nenhuma linha atualizada — verifique se o perfil existe.')
    }
    profile.value = { ...data[0] } as typeof profile.value
  }

  return {
    user,
    session,
    loading,
    profile,
    isAuthenticated,
    displayName,
    avatarUrl,
    initialize,
    waitForAuth,
    fetchProfile,
    signInWithGoogle,
    signOut,
    updateProfile,
  }
})

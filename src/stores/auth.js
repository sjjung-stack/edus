import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  const role = computed(() => {
    if (profile.value?.role) return profile.value.role
    return user.value?.user_metadata?.role || 'student'
  })
  const isAdmin = computed(() => role.value === 'admin')
  const isInstructor = computed(() => role.value === 'instructor')
  const isStudent = computed(() => role.value === 'student')

  async function ensureProfile(authUser, forceRole = null) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error && error.code === 'PGRST116') {
        const meta = authUser.user_metadata || {}
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name: meta.full_name || authUser.email,
          role: forceRole || meta.role || 'student'
        }

        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .single()

        profile.value = created || newProfile
        return profile.value
      }

      if (error) {
        console.warn('profiles 테이블 접근 불가, user_metadata 사용:', error.message)
        const meta = authUser.user_metadata || {}
        profile.value = {
          id: authUser.id,
          email: authUser.email,
          full_name: meta.full_name || authUser.email,
          role: forceRole || meta.role || 'student'
        }
        return profile.value
      }

      if (data) {
        if (forceRole && data.role !== forceRole) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ role: forceRole })
            .eq('id', authUser.id)
            .select()
            .single()
          profile.value = updated || { ...data, role: forceRole }
        } else {
          profile.value = data
        }
        return profile.value
      }
    } catch (e) {
      console.warn('ensureProfile fallback:', e)
      const meta = authUser.user_metadata || {}
      profile.value = {
        id: authUser.id,
        email: authUser.email,
        full_name: meta.full_name || authUser.email,
        role: forceRole || meta.role || 'student'
      }
      return profile.value
    }
  }

  async function init() {
    loading.value = true

    const demoData = localStorage.getItem('lms_demo_user')
    if (demoData) {
      try {
        const parsed = JSON.parse(demoData)
        user.value = parsed.user
        profile.value = parsed.profile
        loading.value = false
        return
      } catch (e) {
        localStorage.removeItem('lms_demo_user')
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user
        await ensureProfile(session.user)
      }
    } catch (e) {
      console.warn('getSession error:', e)
    }
    loading.value = false

    try {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          user.value = session.user
          await ensureProfile(session.user)
        } else {
          user.value = null
          profile.value = null
        }
      })
    } catch (e) {
      console.warn('onAuthStateChange error:', e)
    }
  }

  async function signUp(email, password, fullName, selectedRole = 'student') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole }
      }
    })
    if (error) throw error

    if (data.user) {
      user.value = data.user
      await ensureProfile(data.user, selectedRole)
    }

    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.user) {
      user.value = data.user
      await ensureProfile(data.user)
    }

    return data
  }

  async function signOut() {
    localStorage.removeItem('lms_demo_user')
    try { await supabase.auth.signOut() } catch (e) { /* demo mode */ }
    user.value = null
    profile.value = null
  }

  function isDemoMode() {
    return !!localStorage.getItem('lms_demo_user')
  }

  async function updateProfileRole(userId, newRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    if (userId === user.value?.id) {
      profile.value = data
    }
    return data
  }

  return {
    user, profile, loading,
    isAuthenticated, role, isAdmin, isInstructor, isStudent,
    init, ensureProfile, signUp, signIn, signOut, updateProfileRole, isDemoMode
  }
})

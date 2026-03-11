<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>LMS 로그인</h1>
      <p class="subtitle">수강관리시스템에 오신 것을 환영합니다</p>

      <div v-if="error" class="toast toast-error" style="position:static;margin-bottom:16px;">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>이메일</label>
          <input v-model="email" type="email" class="form-input" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input v-model="password" type="password" class="form-input" placeholder="비밀번호 입력" required />
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <div class="demo-section">
        <p class="demo-title">빠른 데모 로그인</p>
        <div class="demo-buttons">
          <button class="demo-btn demo-admin" @click="demoLogin('admin')">
            <span class="demo-icon">⚙️</span>
            <span>관리자</span>
          </button>
          <button class="demo-btn demo-instructor" @click="demoLogin('instructor')">
            <span class="demo-icon">👨‍🏫</span>
            <span>강사</span>
          </button>
          <button class="demo-btn demo-student" @click="demoLogin('student')">
            <span class="demo-icon">🎓</span>
            <span>수강생</span>
          </button>
        </div>
      </div>

      <p class="auth-footer">
        계정이 없으신가요? <router-link to="/register">회원가입</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.signIn(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
  } finally {
    loading.value = false
  }
}

const demoProfiles = {
  admin: { full_name: '박운영', email: 'admin@demo.lms', role: 'admin' },
  instructor: { full_name: '김전문', email: 'instructor@demo.lms', role: 'instructor' },
  student: { full_name: '이열공', email: 'student@demo.lms', role: 'student' }
}

function demoLogin(role) {
  const p = demoProfiles[role]
  const mockId = `demo-${role}-${Date.now()}`

  auth.user = { id: mockId, email: p.email, user_metadata: { full_name: p.full_name, role: p.role } }
  auth.profile = { id: mockId, ...p }
  auth.loading = false

  localStorage.setItem('lms_demo_user', JSON.stringify({ user: auth.user, profile: auth.profile }))

  router.push('/')
}
</script>

<style scoped>
.demo-section {
  margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--gray-200);
}
.demo-title {
  text-align: center; font-size: 13px; font-weight: 600;
  color: var(--gray-400); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
}
.demo-buttons {
  display: flex; gap: 8px;
}
.demo-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border: 2px solid var(--gray-200); border-radius: var(--radius);
  background: white; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 600;
}
.demo-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.demo-admin:hover { border-color: var(--danger); color: var(--danger); }
.demo-instructor:hover { border-color: var(--warning); color: #92400e; }
.demo-student:hover { border-color: var(--secondary); color: var(--secondary); }
.demo-icon { font-size: 24px; }
</style>

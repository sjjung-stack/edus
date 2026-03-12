<template>
  <div class="auth-page">
    <div class="auth-card">
      <div style="font-size:48px;text-align:center;margin-bottom:8px;animation: bounce 2s infinite;">🌈</div>
      <h1>배움터 로그인</h1>
      <p class="subtitle">재미있는 배움의 세계에 오신 것을 환영해요!</p>

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
          <button class="demo-btn demo-admin" @click="demoLogin('admin')" :disabled="demoLoading">
            <span class="demo-icon">⚙️</span>
            <span>관리자</span>
          </button>
          <button class="demo-btn demo-instructor" @click="demoLogin('instructor')" :disabled="demoLoading">
            <span class="demo-icon">👨‍🏫</span>
            <span>강사</span>
          </button>
          <button class="demo-btn demo-student" @click="demoLogin('student')" :disabled="demoLoading">
            <span class="demo-icon">🎓</span>
            <span>수강생</span>
          </button>
        </div>
        <p v-if="demoLoading" style="text-align:center;font-size:12px;color:var(--gray-400);margin-top:8px;">로그인 중...</p>
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

const demoLoading = ref(false)

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
  margin-top: 28px; padding-top: 28px; border-top: 3px dashed rgba(255, 107, 157, 0.25);
}
.demo-title {
  text-align: center; font-size: 14px; font-weight: 700;
  color: var(--primary); margin-bottom: 14px; letter-spacing: 0.5px;
}
.demo-buttons {
  display: flex; gap: 10px;
}
.demo-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 16px 8px; border: 3px solid #fce4ec; border-radius: 20px;
  background: linear-gradient(180deg, #fff5f9, white); cursor: pointer;
  transition: all 0.3s; font-size: 14px; font-weight: 700; color: var(--gray-700);
}
.demo-btn:hover { transform: translateY(-4px) scale(1.02); box-shadow: var(--shadow-md); }
.demo-btn:active { transform: translateY(0) scale(0.98); }
.demo-admin:hover { border-color: #ff6b6b; background: linear-gradient(180deg, #ffe0e0, white); color: #cc3333; }
.demo-instructor:hover { border-color: #ffcc33; background: linear-gradient(180deg, #fff8e0, white); color: #8a6d00; }
.demo-student:hover { border-color: #45caff; background: linear-gradient(180deg, #e0f5ff, white); color: #1a6faa; }
.demo-icon { font-size: 32px; }

@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
</style>

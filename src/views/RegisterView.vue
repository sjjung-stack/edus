<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>회원가입</h1>
      <p class="subtitle">LMS 계정을 생성하세요</p>

      <div v-if="error" class="toast toast-error" style="position:static;margin-bottom:16px;">
        {{ error }}
      </div>
      <div v-if="success" class="toast toast-success" style="position:static;margin-bottom:16px;">
        {{ success }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>이름</label>
          <input v-model="fullName" type="text" class="form-input" placeholder="홍길동" required />
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input v-model="email" type="email" class="form-input" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input v-model="password" type="password" class="form-input" placeholder="6자 이상 입력" required minlength="6" />
        </div>
        <div class="form-group">
          <label>역할 선택</label>
          <select v-model="selectedRole" class="form-select">
            <option value="student">수강생</option>
            <option value="instructor">강사</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="auth-footer">
        이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
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

const fullName = ref('')
const email = ref('')
const password = ref('')
const selectedRole = ref('student')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const data = await auth.signUp(email.value, password.value, fullName.value, selectedRole.value)

    if (data.session) {
      router.push('/')
    } else {
      success.value = '가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화하세요.'
    }
  } catch (e) {
    error.value = e.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

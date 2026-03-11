<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <h1 style="font-size:24px;">👥 사용자 관리</h1>
      <div style="display:flex;gap:8px;">
        <input v-model="search" type="text" class="form-input" placeholder="이름/이메일 검색..." style="width:220px;" @input="debouncedSearch" />
        <select v-model="filterRole" class="form-select" style="width:120px;" @change="loadUsers">
          <option value="">전체</option>
          <option value="student">수강생</option>
          <option value="instructor">강사</option>
          <option value="admin">관리자</option>
        </select>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">전체 사용자</div>
        <div class="stat-value">{{ totalCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎓</div>
        <div class="stat-label">수강생</div>
        <div class="stat-value">{{ roleCounts.student }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-label">강사</div>
        <div class="stat-value">{{ roleCounts.instructor }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚙️</div>
        <div class="stat-label">관리자</div>
        <div class="stat-value">{{ roleCounts.admin }}</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">
                    {{ u.full_name?.charAt(0) }}
                  </div>
                  <span style="font-weight:600;">{{ u.full_name }}</span>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <select :value="u.role" class="form-select" style="width:100px;padding:4px 8px;font-size:13px;" @change="updateRole(u.id, $event.target.value)">
                  <option value="student">수강생</option>
                  <option value="instructor">강사</option>
                  <option value="admin">관리자</option>
                </select>
              </td>
              <td style="font-size:13px;">{{ formatDate(u.created_at) }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="deleteUser(u.id)" :disabled="u.id === auth.user.id">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const auth = useAuthStore()
const users = ref([])
const search = ref('')
const filterRole = ref('')
const totalCount = ref(0)
const roleCounts = reactive({ student: 0, instructor: 0, admin: 0 })
let timeout = null

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

function debouncedSearch() {
  clearTimeout(timeout)
  timeout = setTimeout(loadUsers, 300)
}

async function loadUsers() {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (filterRole.value) query = query.eq('role', filterRole.value)
  if (search.value) query = query.or(`full_name.ilike.%${search.value}%,email.ilike.%${search.value}%`)
  const { data } = await query
  users.value = data || []

  const { data: all } = await supabase.from('profiles').select('role')
  totalCount.value = all?.length || 0
  roleCounts.student = all?.filter(u => u.role === 'student').length || 0
  roleCounts.instructor = all?.filter(u => u.role === 'instructor').length || 0
  roleCounts.admin = all?.filter(u => u.role === 'admin').length || 0
}

async function updateRole(userId, newRole) {
  await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  await loadUsers()
}

async function deleteUser(userId) {
  if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return
  await supabase.from('profiles').delete().eq('id', userId)
  await loadUsers()
}

onMounted(loadUsers)
</script>

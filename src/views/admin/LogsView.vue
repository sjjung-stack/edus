<template>
  <div>
    <h1 style="font-size:24px;margin-bottom:24px;">📋 시스템 로그</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-label">전체 로그</div>
        <div class="stat-value">{{ logs.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-label">오늘 로그</div>
        <div class="stat-value">{{ todayCount }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>최근 로그</h2>
        <div style="display:flex;gap:8px;">
          <select v-model="filterAction" class="form-select" style="width:160px;" @change="loadLogs">
            <option value="">전체 액션</option>
            <option value="login">로그인</option>
            <option value="signup">회원가입</option>
            <option value="enroll">수강신청</option>
            <option value="submit">과제제출</option>
            <option value="grade">채점</option>
            <option value="error">오류</option>
          </select>
          <button class="btn btn-sm btn-secondary" @click="loadLogs">새로고침</button>
        </div>
      </div>

      <div v-if="!logs.length" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>기록된 로그가 없습니다.</p>
        <p style="font-size:13px;color:var(--gray-400);margin-top:8px;">시스템 활동이 감지되면 여기에 표시됩니다.</p>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>액션</th>
              <th>사용자</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td style="font-size:13px;white-space:nowrap;">{{ formatDate(log.created_at) }}</td>
              <td>
                <span class="badge" :class="actionBadge(log.action)">{{ log.action }}</span>
              </td>
              <td style="font-size:13px;">{{ log.user?.full_name || '-' }}</td>
              <td style="font-size:13px;max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                {{ log.details ? JSON.stringify(log.details) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const logs = ref([])
const filterAction = ref('')

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return logs.value.filter(l => new Date(l.created_at).toDateString() === today).length
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function actionBadge(action) {
  if (action === 'error') return 'badge-danger'
  if (action === 'login' || action === 'signup') return 'badge-info'
  if (action === 'grade') return 'badge-success'
  return 'badge-primary'
}

async function loadLogs() {
  let query = supabase
    .from('system_logs')
    .select('*, user:profiles!user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filterAction.value) query = query.eq('action', filterAction.value)

  const { data } = await query
  logs.value = data || []
}

onMounted(loadLogs)
</script>

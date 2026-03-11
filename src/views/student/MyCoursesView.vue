<template>
  <div>
    <h1 style="font-size:24px;margin-bottom:24px;">🎓 내 수강 강의</h1>

    <div v-if="loading" class="empty-state"><p>불러오는 중...</p></div>
    <div v-else-if="enrollments.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>수강 중인 강의가 없습니다.</p>
      <router-link to="/courses" class="btn btn-primary" style="margin-top:16px;">강의 둘러보기</router-link>
    </div>
    <div v-else class="course-grid">
      <div v-for="e in enrollments" :key="e.id" class="course-card" @click="$router.push(`/courses/${e.course_id}`)">
        <div class="course-thumb" :class="{ completed: e.status === 'completed' }">
          <span>{{ e.status === 'completed' ? '🎉' : '📖' }}</span>
        </div>
        <div class="course-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="badge" :class="e.status === 'completed' ? 'badge-success' : 'badge-primary'">
              {{ e.status === 'completed' ? '완강' : '수강중' }}
            </span>
            <span style="font-size:13px;font-weight:700;color:var(--primary);">{{ e.progress }}%</span>
          </div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">{{ e.courses?.title }}</h3>
          <div class="progress-bar" style="margin-bottom:8px;">
            <div class="progress-fill" :style="{ width: e.progress + '%' }" />
          </div>
          <div style="font-size:12px;color:var(--gray-400);">
            등록일: {{ formatDate(e.enrolled_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const auth = useAuthStore()
const enrollments = ref([])
const loading = ref(true)

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

onMounted(async () => {
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(title, category)')
    .eq('student_id', auth.user.id)
    .order('enrolled_at', { ascending: false })
  enrollments.value = data || []
  loading.value = false
})
</script>

<style scoped>
.course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.course-card {
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: var(--shadow); border: 1px solid var(--gray-100);
  cursor: pointer; transition: all 0.2s;
}
.course-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.course-thumb {
  height: 100px; background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center; font-size: 40px;
}
.course-thumb.completed { background: linear-gradient(135deg, #10b981, #059669); }
.course-body { padding: 16px; }
</style>

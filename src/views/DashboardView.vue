<template>
  <div>
    <h1 style="font-size:24px;margin-bottom:8px;">환영합니다, {{ auth.profile?.full_name }}님! 👋</h1>
    <p style="color:var(--gray-500);margin-bottom:24px;">오늘도 즐거운 학습 되세요.</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-label">{{ auth.isAdmin ? '전체 강의' : auth.isInstructor ? '내 강의 수' : '수강 중인 강의' }}</div>
        <div class="stat-value">{{ stats.courseCount }}</div>
      </div>
      <div class="stat-card" v-if="auth.isStudent">
        <div class="stat-icon">✅</div>
        <div class="stat-label">완료한 강의</div>
        <div class="stat-value">{{ stats.completedCount }}</div>
      </div>
      <div class="stat-card" v-if="auth.isInstructor">
        <div class="stat-icon">👥</div>
        <div class="stat-label">전체 수강생</div>
        <div class="stat-value">{{ stats.studentCount }}</div>
      </div>
      <div class="stat-card" v-if="auth.isAdmin">
        <div class="stat-icon">👥</div>
        <div class="stat-label">전체 사용자</div>
        <div class="stat-value">{{ stats.userCount }}</div>
      </div>
      <div class="stat-card" v-if="!auth.isAdmin">
        <div class="stat-icon">📝</div>
        <div class="stat-label">{{ auth.isInstructor ? '채점 대기' : '미제출 과제' }}</div>
        <div class="stat-value">{{ stats.pendingCount }}</div>
      </div>
    </div>

    <!-- 최근 공지사항 -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header">
        <h2>📢 최근 공지사항</h2>
      </div>
      <div v-if="recentAnnouncements.length === 0" class="empty-state">
        <p>아직 공지사항이 없습니다.</p>
      </div>
      <div v-else>
        <div v-for="a in recentAnnouncements" :key="a.id" style="padding:12px 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:14px;">{{ a.title }}</strong>
            <span style="font-size:12px;color:var(--gray-400);">{{ formatDate(a.created_at) }}</span>
          </div>
          <p style="font-size:13px;color:var(--gray-500);margin-top:4px;">{{ a.content?.substring(0, 100) }}{{ a.content?.length > 100 ? '...' : '' }}</p>
        </div>
      </div>
    </div>

    <!-- 수강생: 내 수강 목록 -->
    <div v-if="auth.isStudent" class="card">
      <div class="card-header">
        <h2>🎓 진행 중인 강의</h2>
        <router-link to="/my-courses" class="btn btn-sm btn-secondary">전체보기</router-link>
      </div>
      <div v-if="myEnrollments.length === 0" class="empty-state">
        <p>수강 중인 강의가 없습니다. <router-link to="/courses">강의 둘러보기</router-link></p>
      </div>
      <div v-else>
        <div v-for="e in myEnrollments.slice(0, 5)" :key="e.id" style="padding:12px 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <router-link :to="`/courses/${e.course_id}`" style="font-weight:600;font-size:14px;">
              {{ e.courses?.title }}
            </router-link>
            <span class="badge badge-primary">{{ e.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: e.progress + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const auth = useAuthStore()

const stats = ref({ courseCount: 0, completedCount: 0, studentCount: 0, userCount: 0, pendingCount: 0 })
const recentAnnouncements = ref([])
const myEnrollments = ref([])

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    if (auth.isStudent) {
      const { data: enr } = await supabase
        .from('enrollments')
        .select('*, courses(title)')
        .eq('student_id', auth.user.id)
        .eq('status', 'enrolled')
      myEnrollments.value = enr || []
      stats.value.courseCount = enr?.length || 0

      const { count: completed } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', auth.user.id)
        .eq('status', 'completed')
      stats.value.completedCount = completed || 0

      const courseIds = enr?.map(e => e.course_id) || []
      if (courseIds.length) {
        const { data: assignments } = await supabase.from('assignments').select('id').in('course_id', courseIds)
        const assIds = assignments?.map(a => a.id) || []
        if (assIds.length) {
          const { data: subs } = await supabase.from('submissions').select('assignment_id').eq('student_id', auth.user.id)
          const submittedIds = new Set(subs?.map(s => s.assignment_id) || [])
          stats.value.pendingCount = assIds.filter(id => !submittedIds.has(id)).length
        }
      }
    }

    if (auth.isInstructor) {
      const { data: courses } = await supabase.from('courses').select('id').eq('instructor_id', auth.user.id)
      stats.value.courseCount = courses?.length || 0
      const cids = courses?.map(c => c.id) || []
      if (cids.length) {
        const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('course_id', cids)
        stats.value.studentCount = count || 0
        const { data: assignments } = await supabase.from('assignments').select('id').in('course_id', cids)
        const aids = assignments?.map(a => a.id) || []
        if (aids.length) {
          const { count: pending } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).in('assignment_id', aids).is('score', null)
          stats.value.pendingCount = pending || 0
        }
      }
    }

    if (auth.isAdmin) {
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      stats.value.userCount = users || 0
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true })
      stats.value.courseCount = courses || 0
    }

    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5)
    recentAnnouncements.value = ann || []
  } catch (e) {
    console.warn('Dashboard data load:', e)
  }
})
</script>

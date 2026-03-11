<template>
  <div>
    <h1 style="font-size:24px;margin-bottom:24px;">📊 플랫폼 통계</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">전체 사용자</div>
        <div class="stat-value">{{ stats.totalUsers }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-label">전체 강의</div>
        <div class="stat-value">{{ stats.totalCourses }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-label">수강 신청 수</div>
        <div class="stat-value">{{ stats.totalEnrollments }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-label">완강률</div>
        <div class="stat-value">{{ stats.completionRate }}%</div>
      </div>
    </div>

    <!-- 강의별 통계 -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header">
        <h2>강의별 수강 현황</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>강의명</th>
              <th>강사</th>
              <th>수강생 수</th>
              <th>평균 진도율</th>
              <th>완강 수</th>
              <th>완강률</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in courseStats" :key="c.id">
              <td style="font-weight:600;">{{ c.title }}</td>
              <td>{{ c.instructor?.full_name }}</td>
              <td>{{ c.enrollmentCount }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="progress-bar" style="width:80px;">
                    <div class="progress-fill" :style="{ width: c.avgProgress + '%' }" />
                  </div>
                  <span style="font-size:13px;">{{ c.avgProgress }}%</span>
                </div>
              </td>
              <td>{{ c.completedCount }}</td>
              <td>
                <span class="badge" :class="c.completionRate >= 50 ? 'badge-success' : 'badge-warning'">
                  {{ c.completionRate }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!courseStats.length" class="empty-state"><p>데이터가 없습니다.</p></div>
    </div>

    <!-- 최근 가입 사용자 -->
    <div class="card">
      <div class="card-header">
        <h2>최근 가입 사용자</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>가입일</th></tr></thead>
          <tbody>
            <tr v-for="u in recentUsers" :key="u.id">
              <td style="font-weight:600;">{{ u.full_name }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" :class="{ 'badge-info': u.role === 'student', 'badge-warning': u.role === 'instructor', 'badge-danger': u.role === 'admin' }">
                  {{ { student: '수강생', instructor: '강사', admin: '관리자' }[u.role] }}
                </span>
              </td>
              <td>{{ formatDate(u.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const stats = reactive({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, completionRate: 0 })
const courseStats = ref([])
const recentUsers = ref([])

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

onMounted(async () => {
  const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  stats.totalUsers = users || 0

  const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true })
  stats.totalCourses = courses || 0

  const { data: enrollments } = await supabase.from('enrollments').select('*')
  stats.totalEnrollments = enrollments?.length || 0
  const completed = enrollments?.filter(e => e.status === 'completed').length || 0
  stats.completionRate = enrollments?.length ? Math.round((completed / enrollments.length) * 100) : 0

  const { data: coursesData } = await supabase
    .from('courses')
    .select('*, instructor:profiles!instructor_id(full_name)')
    .order('created_at', { ascending: false })

  for (const c of coursesData || []) {
    const courseEnrollments = enrollments?.filter(e => e.course_id === c.id) || []
    const completedE = courseEnrollments.filter(e => e.status === 'completed')
    const avgProg = courseEnrollments.length
      ? Math.round(courseEnrollments.reduce((sum, e) => sum + Number(e.progress), 0) / courseEnrollments.length)
      : 0

    courseStats.value.push({
      ...c,
      enrollmentCount: courseEnrollments.length,
      avgProgress: avgProg,
      completedCount: completedE.length,
      completionRate: courseEnrollments.length ? Math.round((completedE.length / courseEnrollments.length) * 100) : 0
    })
  }

  const { data: recent } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10)
  recentUsers.value = recent || []
})
</script>

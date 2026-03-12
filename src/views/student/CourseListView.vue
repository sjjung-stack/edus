<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <h1 style="font-size:24px;">📖 강의 목록</h1>
      <div style="display:flex;gap:8px;">
        <input v-model="search" @input="debouncedSearch" type="text" class="form-input" placeholder="강의명 검색..." style="width:260px;" />
      </div>
    </div>

    <div v-if="store.loading" class="empty-state">
      <p>강의를 불러오는 중...</p>
    </div>
    <div v-else-if="store.courses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>등록된 강의가 없습니다.</p>
    </div>
    <div v-else class="course-grid">
      <div v-for="course in store.courses" :key="course.id" class="course-card" @click="$router.push(`/courses/${course.id}`)">
        <div class="course-thumb">
          <span>📖</span>
        </div>
        <div class="course-body">
          <div style="display:flex;gap:6px;margin-bottom:8px;">
            <span class="badge badge-primary">{{ course.category }}</span>
          </div>
          <h3 class="course-title">{{ course.title }}</h3>
          <p class="course-desc">{{ course.description?.substring(0, 80) }}{{ course.description?.length > 80 ? '...' : '' }}</p>
          <div class="course-meta">
            <span>👤 {{ course.instructor?.full_name }}</span>
            <span>📅 {{ formatDate(course.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCourseStore } from '../../stores/courses'
import { isDemoMode, mockCourses } from '../../lib/mockData'

const store = useCourseStore()
const search = ref('')
let timeout = null

function debouncedSearch() {
  clearTimeout(timeout)
  if (isDemoMode()) {
    const q = search.value.toLowerCase()
    store.courses = q ? mockCourses.filter(c => c.is_published && c.title.toLowerCase().includes(q)) : mockCourses.filter(c => c.is_published)
  } else {
    timeout = setTimeout(() => store.fetchCourses(search.value), 300)
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR')
}

onMounted(() => {
  if (isDemoMode()) {
    store.courses = mockCourses.filter(c => c.is_published)
    store.loading = false
  } else {
    store.fetchCourses()
  }
})
</script>

<style scoped>
.course-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;
}
.course-card {
  background: white; border-radius: 24px; overflow: hidden;
  box-shadow: var(--shadow); border: 3px solid rgba(255,107,157,0.1);
  cursor: pointer; transition: all 0.3s;
}
.course-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: var(--shadow-lg); }
.course-card:nth-child(1) .course-thumb { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
.course-card:nth-child(2) .course-thumb { background: linear-gradient(135deg, #a8edea, #fed6e3); }
.course-card:nth-child(3) .course-thumb { background: linear-gradient(135deg, #ffecd2, #fcb69f); }
.course-card:nth-child(4) .course-thumb { background: linear-gradient(135deg, #c3cfe2, #dee4f7); }
.course-card:nth-child(5) .course-thumb { background: linear-gradient(135deg, #d4fc79, #96e6a1); }
.course-thumb {
  height: 150px; background: linear-gradient(135deg, #ff9bc1, #b07dff);
  display: flex; align-items: center; justify-content: center; font-size: 56px;
}
.course-body { padding: 20px; }
.course-title { font-size: 17px; font-weight: 800; margin-bottom: 6px; color: var(--gray-800); }
.course-desc { font-size: 13px; color: var(--gray-500); margin-bottom: 14px; line-height: 1.6; font-weight: 500; }
.course-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-400); font-weight: 600; }
</style>

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

const store = useCourseStore()
const search = ref('')
let timeout = null

function debouncedSearch() {
  clearTimeout(timeout)
  timeout = setTimeout(() => store.fetchCourses(search.value), 300)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR')
}

onMounted(() => store.fetchCourses())
</script>

<style scoped>
.course-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
}
.course-card {
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: var(--shadow); border: 1px solid var(--gray-100);
  cursor: pointer; transition: all 0.2s;
}
.course-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.course-thumb {
  height: 140px; background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center; font-size: 48px;
}
.course-body { padding: 16px; }
.course-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--gray-800); }
.course-desc { font-size: 13px; color: var(--gray-500); margin-bottom: 12px; line-height: 1.5; }
.course-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-400); }
</style>

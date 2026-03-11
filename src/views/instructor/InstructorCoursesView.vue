<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <h1 style="font-size:24px;">📝 내 강의 관리</h1>
      <button class="btn btn-primary" @click="showCreateModal = true">+ 새 강의 만들기</button>
    </div>

    <div v-if="store.loading" class="empty-state"><p>불러오는 중...</p></div>
    <div v-else-if="store.courses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>아직 등록한 강의가 없습니다.</p>
    </div>
    <div v-else>
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>강의명</th>
              <th>상태</th>
              <th>수강생</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.courses" :key="c.id">
              <td style="font-weight:600;">{{ c.title }}</td>
              <td>
                <span class="badge" :class="c.is_published ? 'badge-success' : 'badge-warning'">
                  {{ c.is_published ? '공개' : '비공개' }}
                </span>
              </td>
              <td>{{ c.enrollments?.[0]?.count || 0 }}명</td>
              <td>{{ formatDate(c.created_at) }}</td>
              <td style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-secondary" @click="$router.push(`/instructor/courses/${c.id}`)">관리</button>
                <button class="btn btn-sm btn-secondary" @click="$router.push(`/instructor/courses/${c.id}/grading`)">채점</button>
                <button class="btn btn-sm btn-danger" @click="handleDelete(c.id)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 강의 생성 모달 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>새 강의 만들기</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>강의명</label>
            <input v-model="newCourse.title" class="form-input" placeholder="강의 제목 입력" />
          </div>
          <div class="form-group">
            <label>설명</label>
            <textarea v-model="newCourse.description" class="form-textarea" placeholder="강의에 대한 설명을 입력하세요"></textarea>
          </div>
          <div class="form-group">
            <label>카테고리</label>
            <select v-model="newCourse.category" class="form-select">
              <option>일반</option>
              <option>프로그래밍</option>
              <option>디자인</option>
              <option>비즈니스</option>
              <option>마케팅</option>
              <option>어학</option>
            </select>
          </div>
          <div class="form-group">
            <label>최대 수강 인원</label>
            <input v-model.number="newCourse.max_students" type="number" class="form-input" />
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;">
            <input v-model="newCourse.is_published" type="checkbox" id="published" />
            <label for="published" style="margin:0;">즉시 공개</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">취소</button>
          <button class="btn btn-primary" @click="createCourse" :disabled="creating">
            {{ creating ? '생성 중...' : '강의 생성' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useCourseStore } from '../../stores/courses'

const auth = useAuthStore()
const store = useCourseStore()

const showCreateModal = ref(false)
const creating = ref(false)
const newCourse = reactive({
  title: '', description: '', category: '일반', max_students: 100, is_published: false
})

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

async function createCourse() {
  creating.value = true
  try {
    await store.createCourse({ ...newCourse, instructor_id: auth.user.id })
    showCreateModal.value = false
    Object.assign(newCourse, { title: '', description: '', category: '일반', max_students: 100, is_published: false })
    await store.fetchInstructorCourses(auth.user.id)
  } catch (e) {
    alert('강의 생성에 실패했습니다: ' + e.message)
  }
  creating.value = false
}

async function handleDelete(id) {
  if (!confirm('정말 이 강의를 삭제하시겠습니까?')) return
  try {
    await store.deleteCourse(id)
    await store.fetchInstructorCourses(auth.user.id)
  } catch (e) {
    alert('삭제 실패: ' + e.message)
  }
}

onMounted(() => store.fetchInstructorCourses(auth.user.id))
</script>

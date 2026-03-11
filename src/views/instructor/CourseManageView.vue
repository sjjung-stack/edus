<template>
  <div v-if="course">
    <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:16px;">← 돌아가기</button>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h1 style="font-size:24px;">{{ course.title }}</h1>
        <p style="color:var(--gray-500);font-size:14px;">강의 콘텐츠 및 과제 관리</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-sm" :class="course.is_published ? 'btn-success' : 'btn-secondary'" @click="togglePublish">
          {{ course.is_published ? '✅ 공개중' : '비공개' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="margin-bottom:16px;">
      <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 콘텐츠 관리 -->
    <div v-if="activeTab === 'contents'" class="card">
      <div class="card-header">
        <h2>콘텐츠 목록</h2>
        <button class="btn btn-sm btn-primary" @click="showContentModal = true">+ 콘텐츠 추가</button>
      </div>
      <div v-if="!contents.length" class="empty-state"><p>콘텐츠를 추가해주세요.</p></div>
      <div v-else>
        <div v-for="(c, i) in contents" :key="c.id" style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-weight:700;color:var(--gray-400);width:24px;">{{ i + 1 }}</span>
            <div>
              <div style="font-weight:600;font-size:14px;">{{ c.title }}</div>
              <span style="font-size:12px;color:var(--gray-400);">
                {{ c.content_type === 'video' ? '🎬 영상' : c.content_type === 'document' ? '📄 문서' : '🔗 링크' }}
                <span v-if="c.duration_minutes"> · {{ c.duration_minutes }}분</span>
              </span>
            </div>
          </div>
          <button class="btn btn-sm btn-danger" @click="deleteContent(c.id)">삭제</button>
        </div>
      </div>
    </div>

    <!-- 과제 관리 -->
    <div v-if="activeTab === 'assignments'" class="card">
      <div class="card-header">
        <h2>과제 목록</h2>
        <button class="btn btn-sm btn-primary" @click="showAssignmentModal = true">+ 과제 추가</button>
      </div>
      <div v-if="!assignments.length" class="empty-state"><p>과제를 추가해주세요.</p></div>
      <div v-else>
        <div v-for="a in assignments" :key="a.id" style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--gray-100);flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:600;font-size:14px;">{{ a.title }}</div>
            <div style="font-size:12px;color:var(--gray-400);">
              마감: {{ a.due_date ? formatDate(a.due_date) : '없음' }} · 배점: {{ a.max_score }}점
            </div>
          </div>
          <button class="btn btn-sm btn-danger" @click="deleteAssignment(a.id)">삭제</button>
        </div>
      </div>
    </div>

    <!-- 공지사항 관리 -->
    <div v-if="activeTab === 'announcements'" class="card">
      <div class="card-header">
        <h2>공지사항</h2>
        <button class="btn btn-sm btn-primary" @click="showAnnouncementModal = true">+ 공지 작성</button>
      </div>
      <div v-if="!announcements.length" class="empty-state"><p>공지사항이 없습니다.</p></div>
      <div v-else>
        <div v-for="a in announcements" :key="a.id" style="padding:12px 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;">{{ a.is_pinned ? '📌 ' : '' }}{{ a.title }}</h3>
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:12px;color:var(--gray-400);">{{ formatDate(a.created_at) }}</span>
              <button class="btn btn-sm btn-danger" @click="deleteAnnouncement(a.id)">삭제</button>
            </div>
          </div>
          <p style="font-size:13px;color:var(--gray-600);margin-top:6px;white-space:pre-wrap;">{{ a.content }}</p>
        </div>
      </div>
    </div>

    <!-- 수강생 목록 -->
    <div v-if="activeTab === 'students'" class="card">
      <div class="card-header"><h2>수강생 목록</h2></div>
      <div v-if="!students.length" class="empty-state"><p>수강생이 없습니다.</p></div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>이름</th><th>이메일</th><th>진도율</th><th>등록일</th></tr></thead>
          <tbody>
            <tr v-for="s in students" :key="s.id">
              <td>{{ s.student?.full_name }}</td>
              <td>{{ s.student?.email }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="progress-bar" style="width:100px;">
                    <div class="progress-fill" :style="{ width: s.progress + '%' }" />
                  </div>
                  <span style="font-size:13px;font-weight:600;">{{ s.progress }}%</span>
                </div>
              </td>
              <td>{{ formatDate(s.enrolled_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 콘텐츠 추가 모달 -->
    <div v-if="showContentModal" class="modal-overlay" @click.self="showContentModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>콘텐츠 추가</h3>
          <button class="modal-close" @click="showContentModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>제목</label>
            <input v-model="newContent.title" class="form-input" placeholder="콘텐츠 제목" />
          </div>
          <div class="form-group">
            <label>유형</label>
            <select v-model="newContent.content_type" class="form-select">
              <option value="video">🎬 영상</option>
              <option value="document">📄 문서</option>
              <option value="link">🔗 링크</option>
            </select>
          </div>
          <div class="form-group">
            <label>URL</label>
            <input v-model="newContent.content_url" class="form-input" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>설명</label>
            <textarea v-model="newContent.description" class="form-textarea" placeholder="콘텐츠 설명"></textarea>
          </div>
          <div class="form-group">
            <label>소요 시간 (분)</label>
            <input v-model.number="newContent.duration_minutes" type="number" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showContentModal = false">취소</button>
          <button class="btn btn-primary" @click="addContent">추가</button>
        </div>
      </div>
    </div>

    <!-- 과제 추가 모달 -->
    <div v-if="showAssignmentModal" class="modal-overlay" @click.self="showAssignmentModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>과제 추가</h3>
          <button class="modal-close" @click="showAssignmentModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>과제명</label>
            <input v-model="newAssignment.title" class="form-input" placeholder="과제 제목" />
          </div>
          <div class="form-group">
            <label>설명</label>
            <textarea v-model="newAssignment.description" class="form-textarea" placeholder="과제 설명"></textarea>
          </div>
          <div class="form-group">
            <label>마감일</label>
            <input v-model="newAssignment.due_date" type="datetime-local" class="form-input" />
          </div>
          <div class="form-group">
            <label>배점</label>
            <input v-model.number="newAssignment.max_score" type="number" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAssignmentModal = false">취소</button>
          <button class="btn btn-primary" @click="addAssignment">추가</button>
        </div>
      </div>
    </div>

    <!-- 공지사항 작성 모달 -->
    <div v-if="showAnnouncementModal" class="modal-overlay" @click.self="showAnnouncementModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>공지사항 작성</h3>
          <button class="modal-close" @click="showAnnouncementModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>제목</label>
            <input v-model="newAnnouncement.title" class="form-input" placeholder="공지 제목" />
          </div>
          <div class="form-group">
            <label>내용</label>
            <textarea v-model="newAnnouncement.content" class="form-textarea" placeholder="공지 내용"></textarea>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;">
            <input v-model="newAnnouncement.is_pinned" type="checkbox" id="pinned" />
            <label for="pinned" style="margin:0;">상단 고정</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAnnouncementModal = false">취소</button>
          <button class="btn btn-primary" @click="addAnnouncement">게시</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state"><p>불러오는 중...</p></div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const props = defineProps(['id'])
const route = useRoute()
const auth = useAuthStore()

const courseId = props.id || route.params.id
const course = ref(null)
const contents = ref([])
const assignments = ref([])
const announcements = ref([])
const students = ref([])
const activeTab = ref('contents')

const showContentModal = ref(false)
const showAssignmentModal = ref(false)
const showAnnouncementModal = ref(false)

const newContent = reactive({ title: '', content_type: 'video', content_url: '', description: '', duration_minutes: 0 })
const newAssignment = reactive({ title: '', description: '', due_date: '', max_score: 100 })
const newAnnouncement = reactive({ title: '', content: '', is_pinned: false })

const tabs = [
  { key: 'contents', label: '📹 콘텐츠' },
  { key: 'assignments', label: '📝 과제' },
  { key: 'announcements', label: '📢 공지사항' },
  { key: 'students', label: '👥 수강생' },
]

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

async function loadData() {
  const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single()
  course.value = c

  const { data: cont } = await supabase.from('course_contents').select('*').eq('course_id', courseId).order('sort_order')
  contents.value = cont || []

  const { data: assgn } = await supabase.from('assignments').select('*').eq('course_id', courseId).order('created_at')
  assignments.value = assgn || []

  const { data: ann } = await supabase.from('announcements').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
  announcements.value = ann || []

  const { data: stds } = await supabase.from('enrollments').select('*, student:profiles!student_id(full_name, email)').eq('course_id', courseId)
  students.value = stds || []
}

async function togglePublish() {
  await supabase.from('courses').update({ is_published: !course.value.is_published }).eq('id', courseId)
  await loadData()
}

async function addContent() {
  await supabase.from('course_contents').insert({ ...newContent, course_id: courseId, sort_order: contents.value.length })
  showContentModal.value = false
  Object.assign(newContent, { title: '', content_type: 'video', content_url: '', description: '', duration_minutes: 0 })
  await loadData()
}

async function deleteContent(id) {
  if (!confirm('콘텐츠를 삭제하시겠습니까?')) return
  await supabase.from('course_contents').delete().eq('id', id)
  await loadData()
}

async function addAssignment() {
  const payload = { title: newAssignment.title, description: newAssignment.description, max_score: newAssignment.max_score, course_id: courseId }
  if (newAssignment.due_date) payload.due_date = newAssignment.due_date
  await supabase.from('assignments').insert(payload)
  showAssignmentModal.value = false
  Object.assign(newAssignment, { title: '', description: '', due_date: '', max_score: 100 })
  await loadData()
}

async function deleteAssignment(id) {
  if (!confirm('과제를 삭제하시겠습니까?')) return
  await supabase.from('assignments').delete().eq('id', id)
  await loadData()
}

async function addAnnouncement() {
  await supabase.from('announcements').insert({ ...newAnnouncement, course_id: courseId, author_id: auth.user.id })
  showAnnouncementModal.value = false
  Object.assign(newAnnouncement, { title: '', content: '', is_pinned: false })
  await loadData()
}

async function deleteAnnouncement(id) {
  if (!confirm('공지를 삭제하시겠습니까?')) return
  await supabase.from('announcements').delete().eq('id', id)
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--gray-200); }
.tab-btn {
  padding: 10px 20px; border: none; background: none; font-size: 14px; font-weight: 600;
  color: var(--gray-500); cursor: pointer; border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all 0.2s;
}
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-btn:hover { color: var(--primary); }
</style>

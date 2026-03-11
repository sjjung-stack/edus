<template>
  <div v-if="course">
    <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:16px;">← 돌아가기</button>

    <div class="course-header-card">
      <div>
        <span class="badge badge-primary" style="margin-bottom:8px;">{{ course.category }}</span>
        <h1 style="font-size:24px;margin-bottom:8px;">{{ course.title }}</h1>
        <p style="color:var(--gray-500);font-size:14px;margin-bottom:12px;">{{ course.description }}</p>
        <div style="display:flex;gap:16px;font-size:13px;color:var(--gray-400);">
          <span>👤 {{ course.instructor?.full_name }}</span>
          <span>📧 {{ course.instructor?.email }}</span>
        </div>
      </div>
      <div v-if="auth.isStudent">
        <button v-if="!enrollment" class="btn btn-primary btn-lg" @click="enroll" :disabled="enrolling">
          {{ enrolling ? '신청 중...' : '수강 신청' }}
        </button>
        <div v-else>
          <span class="badge badge-success" style="font-size:14px;padding:8px 16px;">수강 중 ({{ enrollment.progress }}%)</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="margin:24px 0 16px;">
      <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 콘텐츠 탭 -->
    <div v-if="activeTab === 'contents'" class="card">
      <div v-if="!course.contents?.length" class="empty-state"><p>등록된 콘텐츠가 없습니다.</p></div>
      <div v-else>
        <div v-for="(c, i) in sortedContents" :key="c.id" class="content-row">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="content-num" :class="{ completed: isContentCompleted(c.id) }">
              {{ isContentCompleted(c.id) ? '✓' : i + 1 }}
            </div>
            <div>
              <div style="font-weight:600;font-size:14px;">{{ c.title }}</div>
              <div style="font-size:12px;color:var(--gray-400);">
                {{ c.content_type === 'video' ? '🎬 영상' : c.content_type === 'document' ? '📄 문서' : '🔗 링크' }}
                <span v-if="c.duration_minutes"> · {{ c.duration_minutes }}분</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;" v-if="enrollment">
            <a v-if="c.content_url" :href="c.content_url" target="_blank" class="btn btn-sm btn-secondary">열기</a>
            <button v-if="!isContentCompleted(c.id)" class="btn btn-sm btn-success" @click="markComplete(c.id)">완료</button>
            <span v-else class="badge badge-success">완료</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 과제 탭 -->
    <div v-if="activeTab === 'assignments'" class="card">
      <div v-if="!course.assignments?.length" class="empty-state"><p>등록된 과제가 없습니다.</p></div>
      <div v-else>
        <div v-for="a in course.assignments" :key="a.id" class="content-row">
          <div>
            <div style="font-weight:600;font-size:14px;">{{ a.title }}</div>
            <div style="font-size:12px;color:var(--gray-400);">
              마감: {{ a.due_date ? formatDate(a.due_date) : '없음' }} · 배점: {{ a.max_score }}점
            </div>
            <p style="font-size:13px;color:var(--gray-500);margin-top:4px;">{{ a.description }}</p>
          </div>
          <div v-if="enrollment && auth.isStudent">
            <div v-if="getSubmission(a.id)">
              <span class="badge" :class="getSubmission(a.id).score !== null ? 'badge-success' : 'badge-warning'">
                {{ getSubmission(a.id).score !== null ? `${getSubmission(a.id).score}점` : '채점 대기' }}
              </span>
              <p v-if="getSubmission(a.id).feedback" style="font-size:12px;color:var(--gray-500);margin-top:4px;">
                피드백: {{ getSubmission(a.id).feedback }}
              </p>
            </div>
            <button v-else class="btn btn-sm btn-primary" @click="openSubmitModal(a)">제출</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 공지사항 탭 -->
    <div v-if="activeTab === 'announcements'" class="card">
      <div v-if="!course.announcements?.length" class="empty-state"><p>공지사항이 없습니다.</p></div>
      <div v-else>
        <div v-for="a in sortedAnnouncements" :key="a.id" style="padding:16px 0;border-bottom:1px solid var(--gray-100);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;">
              <span v-if="a.is_pinned">📌 </span>{{ a.title }}
            </h3>
            <span style="font-size:12px;color:var(--gray-400);">{{ formatDate(a.created_at) }}</span>
          </div>
          <p style="font-size:13px;color:var(--gray-600);margin-top:6px;white-space:pre-wrap;">{{ a.content }}</p>
          <span style="font-size:12px;color:var(--gray-400);">작성자: {{ a.author?.full_name }}</span>
        </div>
      </div>
    </div>

    <!-- Q&A 탭 -->
    <div v-if="activeTab === 'qna'" class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;">질의응답</h3>
        <button v-if="enrollment || auth.isInstructor" class="btn btn-sm btn-primary" @click="showQnaModal = true">질문하기</button>
      </div>
      <div v-if="!course.qna?.length" class="empty-state"><p>질문이 없습니다.</p></div>
      <div v-else>
        <router-link :to="`/qna/${course.id}`" style="display:block;">
          <div v-for="q in course.qna" :key="q.id" style="padding:12px 0;border-bottom:1px solid var(--gray-100);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;font-size:14px;">{{ q.title }}</span>
              <span class="badge" :class="q.is_answered ? 'badge-success' : 'badge-warning'">
                {{ q.is_answered ? '답변완료' : '대기중' }}
              </span>
            </div>
            <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">
              {{ q.author?.full_name }} · {{ formatDate(q.created_at) }}
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- 과제 제출 모달 -->
    <div v-if="submitModal" class="modal-overlay" @click.self="submitModal = null">
      <div class="modal">
        <div class="modal-header">
          <h3>과제 제출: {{ submitModal.title }}</h3>
          <button class="modal-close" @click="submitModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>내용</label>
            <textarea v-model="submitContent" class="form-textarea" placeholder="과제 내용을 입력하세요"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="submitModal = null">취소</button>
          <button class="btn btn-primary" @click="submitAssignment" :disabled="submitting">
            {{ submitting ? '제출 중...' : '제출' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Q&A 작성 모달 -->
    <div v-if="showQnaModal" class="modal-overlay" @click.self="showQnaModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>질문 작성</h3>
          <button class="modal-close" @click="showQnaModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>제목</label>
            <input v-model="qnaTitle" class="form-input" placeholder="질문 제목" />
          </div>
          <div class="form-group">
            <label>내용</label>
            <textarea v-model="qnaContent" class="form-textarea" placeholder="질문 내용을 작성하세요"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showQnaModal = false">취소</button>
          <button class="btn btn-primary" @click="postQuestion">등록</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state"><p>강의를 불러오는 중...</p></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCourseStore } from '../../stores/courses'
import { supabase } from '../../lib/supabase'

const props = defineProps(['id'])
const route = useRoute()
const auth = useAuthStore()
const courseStore = useCourseStore()

const course = ref(null)
const enrollment = ref(null)
const submissions = ref([])
const progress = ref([])
const enrolling = ref(false)
const activeTab = ref('contents')
const submitModal = ref(null)
const submitContent = ref('')
const submitting = ref(false)
const showQnaModal = ref(false)
const qnaTitle = ref('')
const qnaContent = ref('')

const tabs = [
  { key: 'contents', label: '📹 콘텐츠' },
  { key: 'assignments', label: '📝 과제' },
  { key: 'announcements', label: '📢 공지사항' },
  { key: 'qna', label: '❓ Q&A' }
]

const courseId = computed(() => props.id || route.params.id)

const sortedContents = computed(() =>
  [...(course.value?.contents || [])].sort((a, b) => a.sort_order - b.sort_order)
)

const sortedAnnouncements = computed(() =>
  [...(course.value?.announcements || [])].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.created_at) - new Date(a.created_at)
  })
)

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR') }

function isContentCompleted(contentId) {
  return progress.value.some(p => p.content_id === contentId && p.completed)
}

function getSubmission(assignmentId) {
  return submissions.value.find(s => s.assignment_id === assignmentId)
}

async function loadData() {
  course.value = await courseStore.fetchCourse(courseId.value)

  if (auth.isStudent) {
    const { data: enr } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', auth.user.id)
      .eq('course_id', courseId.value)
      .single()
    enrollment.value = enr

    if (enr) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', auth.user.id)
      submissions.value = subs || []

      const contentIds = course.value?.contents?.map(c => c.id) || []
      if (contentIds.length) {
        const { data: prog } = await supabase
          .from('content_progress')
          .select('*')
          .eq('student_id', auth.user.id)
          .in('content_id', contentIds)
        progress.value = prog || []
      }
    }
  }
}

async function enroll() {
  enrolling.value = true
  try {
    await supabase.from('enrollments').insert({
      student_id: auth.user.id,
      course_id: courseId.value
    })
    await loadData()
  } catch (e) {
    alert('수강 신청에 실패했습니다.')
  }
  enrolling.value = false
}

async function markComplete(contentId) {
  await supabase.from('content_progress').upsert({
    student_id: auth.user.id,
    content_id: contentId,
    completed: true,
    completed_at: new Date().toISOString()
  })
  const totalContents = course.value.contents?.length || 1
  const completedCount = progress.value.filter(p => p.completed).length + 1
  const newProgress = Math.round((completedCount / totalContents) * 100)
  await supabase.from('enrollments').update({ progress: newProgress }).eq('id', enrollment.value.id)
  await loadData()
}

function openSubmitModal(assignment) {
  submitModal.value = assignment
  submitContent.value = ''
}

async function submitAssignment() {
  submitting.value = true
  await supabase.from('submissions').insert({
    assignment_id: submitModal.value.id,
    student_id: auth.user.id,
    content: submitContent.value
  })
  submitModal.value = null
  submitting.value = false
  await loadData()
}

async function postQuestion() {
  await supabase.from('qna').insert({
    course_id: courseId.value,
    author_id: auth.user.id,
    title: qnaTitle.value,
    content: qnaContent.value
  })
  showQnaModal.value = false
  qnaTitle.value = ''
  qnaContent.value = ''
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.course-header-card {
  background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px;
  box-shadow: var(--shadow); border: 1px solid var(--gray-100);
  display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;
}
.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--gray-200); }
.tab-btn {
  padding: 10px 20px; border: none; background: none; font-size: 14px; font-weight: 600;
  color: var(--gray-500); cursor: pointer; border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all 0.2s;
}
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-btn:hover { color: var(--primary); }
.content-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid var(--gray-100); gap: 12px; flex-wrap: wrap;
}
.content-num {
  width: 32px; height: 32px; border-radius: 50%; background: var(--gray-200);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; color: var(--gray-600);
}
.content-num.completed { background: var(--success); color: white; }
</style>

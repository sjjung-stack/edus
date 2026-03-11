<template>
  <div>
    <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:16px;">← 돌아가기</button>
    <h1 style="font-size:24px;margin-bottom:24px;">❓ 질의응답</h1>

    <div v-if="loading" class="empty-state"><p>불러오는 중...</p></div>
    <div v-else-if="questions.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <p>등록된 질문이 없습니다.</p>
    </div>
    <div v-else>
      <div v-for="q in questions" :key="q.id" class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:16px;">{{ q.title }}</h3>
          <span class="badge" :class="q.is_answered ? 'badge-success' : 'badge-warning'">
            {{ q.is_answered ? '답변완료' : '대기중' }}
          </span>
        </div>
        <p style="font-size:14px;color:var(--gray-600);white-space:pre-wrap;margin-bottom:12px;">{{ q.content }}</p>
        <div style="font-size:12px;color:var(--gray-400);margin-bottom:16px;">
          {{ q.author?.full_name }} · {{ formatDate(q.created_at) }}
        </div>

        <!-- 답변 목록 -->
        <div v-if="q.replies?.length" style="border-top:1px solid var(--gray-100);padding-top:12px;">
          <div v-for="r in q.replies" :key="r.id" style="background:var(--gray-50);border-radius:8px;padding:12px;margin-bottom:8px;">
            <p style="font-size:13px;white-space:pre-wrap;">{{ r.content }}</p>
            <div style="font-size:11px;color:var(--gray-400);margin-top:6px;">
              {{ r.author?.full_name }} · {{ formatDate(r.created_at) }}
            </div>
          </div>
        </div>

        <!-- 답변 작성 -->
        <div style="margin-top:12px;display:flex;gap:8px;">
          <input v-model="replyTexts[q.id]" class="form-input" placeholder="답변을 입력하세요..." style="flex:1;" />
          <button class="btn btn-sm btn-primary" @click="postReply(q.id)" :disabled="!replyTexts[q.id]">답변</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const props = defineProps(['courseId'])
const route = useRoute()
const auth = useAuthStore()

const questions = ref([])
const loading = ref(true)
const replyTexts = reactive({})

const cid = props.courseId || route.params.courseId

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

async function loadQuestions() {
  const { data } = await supabase
    .from('qna')
    .select('*, author:profiles!author_id(full_name), replies:qna_replies(*, author:profiles!author_id(full_name))')
    .eq('course_id', cid)
    .order('created_at', { ascending: false })
  questions.value = data || []
  loading.value = false
}

async function postReply(qnaId) {
  await supabase.from('qna_replies').insert({
    qna_id: qnaId,
    author_id: auth.user.id,
    content: replyTexts[qnaId]
  })
  await supabase.from('qna').update({ is_answered: true }).eq('id', qnaId)
  replyTexts[qnaId] = ''
  await loadQuestions()
}

onMounted(loadQuestions)
</script>

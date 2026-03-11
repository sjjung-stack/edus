<template>
  <div>
    <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:16px;">← 돌아가기</button>
    <h1 style="font-size:24px;margin-bottom:24px;">✏️ 과제 채점</h1>

    <div v-if="loading" class="empty-state"><p>불러오는 중...</p></div>

    <div v-else>
      <div v-for="a in assignments" :key="a.id" class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <h2>{{ a.title }}</h2>
          <span class="badge badge-info">배점 {{ a.max_score }}점</span>
        </div>

        <div v-if="!a.submissions?.length" class="empty-state" style="padding:24px;">
          <p>제출된 과제가 없습니다.</p>
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>학생</th>
                <th>제출 내용</th>
                <th>제출일</th>
                <th>점수</th>
                <th>피드백</th>
                <th>채점</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in a.submissions" :key="s.id">
                <td style="font-weight:600;">{{ s.student?.full_name }}</td>
                <td style="max-width:200px;">
                  <p style="font-size:13px;color:var(--gray-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    {{ s.content }}
                  </p>
                </td>
                <td style="font-size:13px;">{{ formatDate(s.submitted_at) }}</td>
                <td>
                  <input
                    v-model.number="gradeInputs[s.id].score"
                    type="number"
                    class="form-input"
                    :max="a.max_score"
                    :min="0"
                    style="width:80px;"
                  />
                </td>
                <td>
                  <input
                    v-model="gradeInputs[s.id].feedback"
                    class="form-input"
                    placeholder="피드백 입력..."
                    style="width:180px;"
                  />
                </td>
                <td>
                  <button
                    class="btn btn-sm"
                    :class="s.score !== null ? 'btn-success' : 'btn-primary'"
                    @click="gradeSubmission(s.id)"
                  >
                    {{ s.score !== null ? '수정' : '채점' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!assignments.length" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>이 강의에 등록된 과제가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'

const props = defineProps(['id'])
const route = useRoute()
const courseId = props.id || route.params.id

const assignments = ref([])
const loading = ref(true)
const gradeInputs = reactive({})

function formatDate(d) { return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

async function loadData() {
  const { data } = await supabase
    .from('assignments')
    .select('*, submissions(*, student:profiles!student_id(full_name, email))')
    .eq('course_id', courseId)
    .order('created_at')

  assignments.value = data || []

  for (const a of data || []) {
    for (const s of a.submissions || []) {
      gradeInputs[s.id] = { score: s.score ?? '', feedback: s.feedback ?? '' }
    }
  }
  loading.value = false
}

async function gradeSubmission(submissionId) {
  const input = gradeInputs[submissionId]
  await supabase.from('submissions').update({
    score: input.score,
    feedback: input.feedback,
    graded_at: new Date().toISOString()
  }).eq('id', submissionId)
  await loadData()
}

onMounted(loadData)
</script>

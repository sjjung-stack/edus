<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <h1 style="font-size:24px;">📅 강의 캘린더</h1>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="legend">
          <span class="legend-dot" style="background:var(--primary);"></span> 강의 개설
          <span class="legend-dot" style="background:var(--danger);margin-left:12px;"></span> 과제 마감
          <span class="legend-dot" style="background:var(--success);margin-left:12px;"></span> 수강 등록
        </div>
      </div>
    </div>

    <!-- 월 네비게이션 -->
    <div class="cal-header">
      <button class="btn btn-secondary btn-sm" @click="prevMonth">← 이전</button>
      <h2 class="cal-title">{{ year }}년 {{ month + 1 }}월</h2>
      <button class="btn btn-secondary btn-sm" @click="nextMonth">다음 →</button>
    </div>

    <!-- 요일 헤더 -->
    <div class="cal-grid cal-weekdays">
      <div v-for="d in weekdays" :key="d" class="cal-weekday">{{ d }}</div>
    </div>

    <!-- 날짜 그리드 -->
    <div class="cal-grid cal-days">
      <div
        v-for="(day, i) in calendarDays"
        :key="i"
        class="cal-day"
        :class="{
          'other-month': !day.currentMonth,
          'today': day.isToday,
          'has-events': day.events.length > 0
        }"
        @click="selectDay(day)"
      >
        <div class="day-number">{{ day.date }}</div>
        <div class="day-events">
          <div
            v-for="(ev, j) in day.events.slice(0, 3)"
            :key="j"
            class="day-event"
            :class="'event-' + ev.type"
            :title="ev.title"
          >
            {{ ev.title }}
          </div>
          <div v-if="day.events.length > 3" class="day-more">
            +{{ day.events.length - 3 }}개 더
          </div>
        </div>
      </div>
    </div>

    <!-- 선택된 날짜 상세 -->
    <div v-if="selectedDay && selectedDay.events.length > 0" class="card" style="margin-top:24px;">
      <div class="card-header">
        <h2>{{ selectedDay.fullDate }} 일정</h2>
        <button class="btn btn-sm btn-secondary" @click="selectedDay = null">닫기</button>
      </div>
      <div v-for="ev in selectedDay.events" :key="ev.id" class="event-detail">
        <div class="event-detail-left">
          <span class="event-badge" :class="'event-' + ev.type">
            {{ ev.type === 'course' ? '📖' : ev.type === 'assignment' ? '📝' : '🎓' }}
          </span>
          <div>
            <div style="font-weight:600;font-size:14px;">{{ ev.title }}</div>
            <div style="font-size:12px;color:var(--gray-400);">
              {{ ev.subtitle }}
              <span v-if="ev.time"> · {{ ev.time }}</span>
            </div>
          </div>
        </div>
        <router-link
          v-if="ev.link"
          :to="ev.link"
          class="btn btn-sm btn-primary"
        >보기</router-link>
      </div>
    </div>

    <!-- 이번 달 전체 일정 목록 -->
    <div class="card" style="margin-top:24px;">
      <div class="card-header">
        <h2>{{ month + 1 }}월 전체 일정 ({{ allEventsThisMonth.length }}건)</h2>
      </div>
      <div v-if="allEventsThisMonth.length === 0" class="empty-state" style="padding:24px;">
        <p>이번 달 일정이 없습니다.</p>
      </div>
      <div v-else>
        <div v-for="ev in allEventsThisMonth" :key="ev.id" class="event-detail">
          <div class="event-detail-left">
            <span class="event-badge" :class="'event-' + ev.type">
              {{ ev.type === 'course' ? '📖' : ev.type === 'assignment' ? '📝' : '🎓' }}
            </span>
            <div>
              <div style="font-weight:600;font-size:14px;">{{ ev.title }}</div>
              <div style="font-size:12px;color:var(--gray-400);">
                {{ ev.dateLabel }} · {{ ev.subtitle }}
              </div>
            </div>
          </div>
          <router-link v-if="ev.link" :to="ev.link" class="btn btn-sm btn-secondary">보기</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const auth = useAuthStore()
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const selectedDay = ref(null)

const courses = ref([])
const assignments = ref([])
const enrollments = ref([])

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
  selectedDay.value = null
}

function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
  selectedDay.value = null
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function getEventsForDate(date) {
  const events = []

  courses.value.forEach(c => {
    const created = new Date(c.created_at)
    if (isSameDay(created, date)) {
      events.push({
        id: 'c-' + c.id,
        type: 'course',
        title: c.title,
        subtitle: `강사: ${c.instructor?.full_name || ''}`,
        time: created.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        link: `/courses/${c.id}`,
        dateLabel: `${created.getMonth() + 1}/${created.getDate()}`,
        sortDate: created
      })
    }
  })

  assignments.value.forEach(a => {
    if (a.due_date) {
      const due = new Date(a.due_date)
      if (isSameDay(due, date)) {
        events.push({
          id: 'a-' + a.id,
          type: 'assignment',
          title: `[마감] ${a.title}`,
          subtitle: `${a.course?.title || ''} · 배점 ${a.max_score}점`,
          time: due.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          link: a.course_id ? `/courses/${a.course_id}` : null,
          dateLabel: `${due.getMonth() + 1}/${due.getDate()}`,
          sortDate: due
        })
      }
    }
  })

  enrollments.value.forEach(e => {
    const enrolled = new Date(e.enrolled_at)
    if (isSameDay(enrolled, date)) {
      events.push({
        id: 'e-' + e.id,
        type: 'enrollment',
        title: `수강 등록: ${e.courses?.title || ''}`,
        subtitle: `진도율: ${e.progress}%`,
        time: enrolled.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        link: e.course_id ? `/courses/${e.course_id}` : null,
        dateLabel: `${enrolled.getMonth() + 1}/${enrolled.getDate()}`,
        sortDate: enrolled
      })
    }
  })

  return events.sort((a, b) => a.sortDate - b.sortDate)
}

const calendarDays = computed(() => {
  const firstDay = new Date(year.value, month.value, 1)
  const lastDay = new Date(year.value, month.value + 1, 0)
  const startPad = firstDay.getDay()
  const today = new Date()
  const days = []

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year.value, month.value, -i)
    days.push({
      date: d.getDate(),
      fullDate: formatFullDate(d),
      currentMonth: false,
      isToday: false,
      events: getEventsForDate(d),
      _date: d
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year.value, month.value, i)
    days.push({
      date: i,
      fullDate: formatFullDate(d),
      currentMonth: true,
      isToday: isSameDay(d, today),
      events: getEventsForDate(d),
      _date: d
    })
  }

  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year.value, month.value + 1, i)
      days.push({
        date: d.getDate(),
        fullDate: formatFullDate(d),
        currentMonth: false,
        isToday: false,
        events: getEventsForDate(d),
        _date: d
      })
    }
  }

  return days
})

const allEventsThisMonth = computed(() => {
  const events = []
  calendarDays.value
    .filter(d => d.currentMonth)
    .forEach(d => events.push(...d.events))
  return events.sort((a, b) => a.sortDate - b.sortDate)
})

function formatFullDate(d) {
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function selectDay(day) {
  selectedDay.value = selectedDay.value?.fullDate === day.fullDate ? null : day
}

async function loadData() {
  try {
    const { data: c } = await supabase
      .from('courses')
      .select('*, instructor:profiles!instructor_id(full_name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    courses.value = c || []

    const courseIds = (c || []).map(x => x.id)

    if (courseIds.length) {
      const { data: a } = await supabase
        .from('assignments')
        .select('*, course:courses!course_id(title)')
        .in('course_id', courseIds)
      assignments.value = a || []
    }

    if (auth.isStudent && auth.user?.id) {
      const { data: e } = await supabase
        .from('enrollments')
        .select('*, courses(title)')
        .eq('student_id', auth.user.id)
      enrollments.value = e || []
    } else if (auth.isInstructor && auth.user?.id) {
      const instrCourseIds = (c || []).filter(x => x.instructor_id === auth.user.id).map(x => x.id)
      if (instrCourseIds.length) {
        const { data: e } = await supabase
          .from('enrollments')
          .select('*, courses(title)')
          .in('course_id', instrCourseIds)
        enrollments.value = e || []
      }
    } else if (auth.isAdmin) {
      const { data: e } = await supabase
        .from('enrollments')
        .select('*, courses(title)')
      enrollments.value = e || []
    }
  } catch (e) {
    console.warn('Calendar data load:', e)
  }
}

onMounted(loadData)
watch([year, month], loadData)
</script>

<style scoped>
.cal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.cal-title { font-size: 20px; font-weight: 700; color: var(--gray-800); }

.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
  background: var(--gray-200); border-radius: 12px; overflow: hidden;
}
.cal-weekdays { margin-bottom: 0; border-radius: 12px 12px 0 0; }
.cal-days { border-radius: 0 0 12px 12px; }

.cal-weekday {
  background: var(--gray-100); padding: 10px; text-align: center;
  font-size: 13px; font-weight: 700; color: var(--gray-500);
}
.cal-weekday:first-child { color: var(--danger); }
.cal-weekday:last-child { color: var(--secondary); }

.cal-day {
  background: white; min-height: 100px; padding: 8px;
  cursor: pointer; transition: background 0.15s; vertical-align: top;
}
.cal-day:hover { background: var(--gray-50); }
.cal-day.other-month { background: var(--gray-50); }
.cal-day.other-month .day-number { color: var(--gray-300); }
.cal-day.today { background: #eef2ff; }
.cal-day.today .day-number {
  background: var(--primary); color: white; border-radius: 50%;
  width: 28px; height: 28px; display: flex; align-items: center;
  justify-content: center; font-weight: 700;
}
.cal-day.has-events { position: relative; }

.day-number { font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 4px; }
.cal-day:nth-child(7n+1) .day-number { color: var(--danger); }
.cal-day:nth-child(7n) .day-number { color: var(--secondary); }
.cal-day.other-month:nth-child(7n+1) .day-number,
.cal-day.other-month:nth-child(7n) .day-number { opacity: 0.4; }

.day-events { display: flex; flex-direction: column; gap: 2px; }
.day-event {
  font-size: 11px; padding: 2px 6px; border-radius: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-weight: 500; line-height: 1.4;
}
.event-course { background: #eef2ff; color: var(--primary); }
.event-assignment { background: #fee2e2; color: #991b1b; }
.event-enrollment { background: #d1fae5; color: #065f46; }

.day-more { font-size: 10px; color: var(--gray-400); padding-left: 6px; }

/* 상세 */
.event-detail {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid var(--gray-100); gap: 12px;
}
.event-detail:last-child { border-bottom: none; }
.event-detail-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.event-badge {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
}
.event-badge.event-course { background: #eef2ff; }
.event-badge.event-assignment { background: #fee2e2; }
.event-badge.event-enrollment { background: #d1fae5; }

.legend { font-size: 12px; color: var(--gray-500); display: flex; align-items: center; gap: 4px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }

@media (max-width: 768px) {
  .cal-day { min-height: 60px; padding: 4px; }
  .day-event { font-size: 9px; padding: 1px 3px; }
  .day-number { font-size: 11px; }
  .legend { display: none; }
  .cal-title { font-size: 16px; }
}
</style>

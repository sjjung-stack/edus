const now = new Date()
const d = (daysAgo) => new Date(now.getTime() - daysAgo * 86400000).toISOString()

export const mockCourses = [
  { id: 'c1', title: '재미있는 그림 그리기', description: '색연필과 크레파스로 예쁜 그림을 그려봐요!', category: '미술', instructor_id: 'demo-instructor', is_published: true, max_students: 30, created_at: d(20), updated_at: d(20), instructor: { full_name: '김전문', email: 'instructor@demo.lms' } },
  { id: 'c2', title: '알파벳 ABC 배우기', description: '노래와 함께 즐겁게 영어 알파벳을 배워요!', category: '어학', instructor_id: 'demo-instructor', is_published: true, max_students: 25, created_at: d(15), updated_at: d(15), instructor: { full_name: '김전문', email: 'instructor@demo.lms' } },
  { id: 'c3', title: '숫자 놀이 1-100', description: '신나는 숫자 세기와 간단한 덧셈 뺄셈을 해봐요!', category: '수학', instructor_id: 'demo-instructor', is_published: true, max_students: 20, created_at: d(10), updated_at: d(10), instructor: { full_name: '김전문', email: 'instructor@demo.lms' } },
  { id: 'c4', title: '동요 부르기 교실', description: '예쁜 동요를 함께 부르며 음악을 배워요!', category: '음악', instructor_id: 'demo-instructor', is_published: true, max_students: 35, created_at: d(5), updated_at: d(5), instructor: { full_name: '김전문', email: 'instructor@demo.lms' } },
  { id: 'c5', title: '과학 실험 놀이', description: '집에서 할 수 있는 재미있는 과학 실험!', category: '과학', instructor_id: 'demo-instructor', is_published: false, max_students: 15, created_at: d(2), updated_at: d(2), instructor: { full_name: '김전문', email: 'instructor@demo.lms' } },
]

export const mockAssignments = [
  { id: 'a1', course_id: 'c1', title: '내가 좋아하는 동물 그리기', max_score: 100, due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString(), created_at: d(5), course: { title: '재미있는 그림 그리기' } },
  { id: 'a2', course_id: 'c2', title: 'A~Z 따라쓰기 숙제', max_score: 50, due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString(), created_at: d(3), course: { title: '알파벳 ABC 배우기' } },
  { id: 'a3', course_id: 'c3', title: '덧셈 문제 10개 풀기', max_score: 100, due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString(), created_at: d(2), course: { title: '숫자 놀이 1-100' } },
  { id: 'a4', course_id: 'c4', title: '동요 녹음해서 보내기', max_score: 100, due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(), created_at: d(10), course: { title: '동요 부르기 교실' } },
]

export const mockEnrollments = [
  { id: 'e1', course_id: 'c1', student_id: 'demo-student', progress: 65, enrolled_at: d(18), courses: { title: '재미있는 그림 그리기' } },
  { id: 'e2', course_id: 'c2', student_id: 'demo-student', progress: 40, enrolled_at: d(12), courses: { title: '알파벳 ABC 배우기' } },
  { id: 'e3', course_id: 'c3', student_id: 'demo-student', progress: 90, enrolled_at: d(8), courses: { title: '숫자 놀이 1-100' } },
  { id: 'e4', course_id: 'c4', student_id: 'demo-student', progress: 20, enrolled_at: d(3), courses: { title: '동요 부르기 교실' } },
]

export const mockAnnouncements = [
  { id: 'n1', course_id: 'c1', title: '이번 주는 수채화를 배워요!', content: '물감과 붓을 준비해 주세요.', created_at: d(1), author: { full_name: '김전문' } },
  { id: 'n2', course_id: 'c2', title: '알파벳 노래 영상 업로드', content: '새로운 알파벳 노래를 올렸어요!', created_at: d(2), author: { full_name: '김전문' } },
  { id: 'n3', course_id: 'c3', title: '구구단 특별 수업 안내', content: '이번 주 토요일에 구구단 특별 수업이 있어요.', created_at: d(3), author: { full_name: '김전문' } },
]

export const mockUsers = [
  { id: 'u1', email: 'admin@demo.lms', full_name: '박운영', role: 'admin', created_at: d(30) },
  { id: 'u2', email: 'instructor@demo.lms', full_name: '김전문', role: 'instructor', created_at: d(28) },
  { id: 'u3', email: 'student1@demo.lms', full_name: '이열공', role: 'student', created_at: d(25) },
  { id: 'u4', email: 'student2@demo.lms', full_name: '최다솜', role: 'student', created_at: d(20) },
  { id: 'u5', email: 'student3@demo.lms', full_name: '정하늘', role: 'student', created_at: d(15) },
]

export const mockLogs = [
  { id: 'l1', action: 'user_login', details: '박운영 로그인', created_at: d(0), user: { full_name: '박운영' } },
  { id: 'l2', action: 'course_created', details: '과학 실험 놀이 강의 생성', created_at: d(2), user: { full_name: '김전문' } },
  { id: 'l3', action: 'enrollment', details: '동요 부르기 교실 수강 등록', created_at: d(3), user: { full_name: '이열공' } },
  { id: 'l4', action: 'assignment_submit', details: '그림 그리기 과제 제출', created_at: d(4), user: { full_name: '최다솜' } },
  { id: 'l5', action: 'user_login', details: '김전문 로그인', created_at: d(5), user: { full_name: '김전문' } },
]

export function isDemoMode() {
  return !!localStorage.getItem('lms_demo_user')
}

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('../views/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'calendar', name: 'Calendar', component: () => import('../views/CalendarView.vue') },
      // 수강생 라우트
      { path: 'courses', name: 'CourseList', component: () => import('../views/student/CourseListView.vue') },
      { path: 'courses/:id', name: 'CourseDetail', component: () => import('../views/student/CourseDetailView.vue'), props: true },
      { path: 'my-courses', name: 'MyCourses', component: () => import('../views/student/MyCoursesView.vue'), meta: { roles: ['student'] } },
      { path: 'qna/:courseId', name: 'QnA', component: () => import('../views/student/QnAView.vue'), props: true },
      // 강사 라우트
      { path: 'instructor/courses', name: 'InstructorCourses', component: () => import('../views/instructor/InstructorCoursesView.vue'), meta: { roles: ['instructor'] } },
      { path: 'instructor/courses/:id', name: 'InstructorCourseDetail', component: () => import('../views/instructor/CourseManageView.vue'), props: true, meta: { roles: ['instructor'] } },
      { path: 'instructor/courses/:id/grading', name: 'Grading', component: () => import('../views/instructor/GradingView.vue'), props: true, meta: { roles: ['instructor'] } },
      // 관리자 라우트
      { path: 'admin/users', name: 'AdminUsers', component: () => import('../views/admin/UsersView.vue'), meta: { roles: ['admin'] } },
      { path: 'admin/stats', name: 'AdminStats', component: () => import('../views/admin/StatsView.vue'), meta: { roles: ['admin'] } },
      { path: 'admin/logs', name: 'AdminLogs', component: () => import('../views/admin/LogsView.vue'), meta: { roles: ['admin'] } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (auth.loading) {
    await new Promise(resolve => {
      const unwatch = auth.$subscribe(() => {
        if (!auth.loading) { unwatch(); resolve() }
      })
      if (!auth.loading) { unwatch(); resolve() }
    })
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return next('/')
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return next('/')
  }
  next()
})

export default router

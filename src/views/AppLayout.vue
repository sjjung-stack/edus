<template>
  <div class="app-layout">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
        <span>☰</span>
      </button>
      <span class="mobile-title">LMS</span>
      <div class="header-user">{{ auth.profile?.full_name }}</div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">LMS</span>
        </div>
        <button class="sidebar-close" @click="sidebarOpen = false">×</button>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar">{{ auth.profile?.full_name?.charAt(0) }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.profile?.full_name }}</div>
          <div class="user-role">
            <span class="badge" :class="roleBadgeClass">{{ roleLabel }}</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">🏠</span> 대시보드
        </router-link>

        <div class="nav-section">공통</div>
        <router-link to="/courses" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">📖</span> 강의 목록
        </router-link>
        <router-link to="/calendar" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">📅</span> 강의 캘린더
        </router-link>

        <template v-if="auth.isStudent">
          <div class="nav-section">수강생</div>
          <router-link to="/my-courses" class="nav-item" @click="sidebarOpen = false">
            <span class="nav-icon">🎓</span> 내 수강 강의
          </router-link>
        </template>

        <template v-if="auth.isInstructor">
          <div class="nav-section">강사</div>
          <router-link to="/instructor/courses" class="nav-item" @click="sidebarOpen = false">
            <span class="nav-icon">📝</span> 강의 관리
          </router-link>
        </template>

        <template v-if="auth.isAdmin">
          <div class="nav-section">관리자</div>
          <router-link to="/admin/users" class="nav-item" @click="sidebarOpen = false">
            <span class="nav-icon">👥</span> 사용자 관리
          </router-link>
          <router-link to="/admin/stats" class="nav-item" @click="sidebarOpen = false">
            <span class="nav-icon">📊</span> 통계
          </router-link>
          <router-link to="/admin/logs" class="nav-item" @click="sidebarOpen = false">
            <span class="nav-icon">📋</span> 시스템 로그
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <span class="nav-icon">🚪</span> 로그아웃
        </button>
      </div>
    </aside>

    <!-- Backdrop -->
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const roleLabel = computed(() => {
  const labels = { student: '수강생', instructor: '강사', admin: '관리자' }
  return labels[auth.role] || '수강생'
})

const roleBadgeClass = computed(() => {
  const classes = { student: 'badge-info', instructor: 'badge-warning', admin: 'badge-danger' }
  return classes[auth.role] || 'badge-info'
})

async function handleLogout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }

/* Sidebar */
.sidebar {
  width: var(--sidebar-width); background: white; border-right: 1px solid var(--gray-200);
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100; transition: transform 0.3s;
}
.sidebar-header {
  padding: 20px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--gray-100);
}
.logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 28px; }
.logo-text { font-size: 20px; font-weight: 800; color: var(--primary); }
.sidebar-close { display: none; background: none; border: none; font-size: 28px; cursor: pointer; color: var(--gray-400); }

.sidebar-user {
  padding: 20px; display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--gray-100);
}
.user-avatar {
  width: 42px; height: 42px; border-radius: 50%; background: var(--primary);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px;
}
.user-name { font-weight: 600; font-size: 14px; }
.user-role { margin-top: 2px; }

.sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 0; }
.nav-section { padding: 12px 20px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gray-400); letter-spacing: 0.5px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  color: var(--gray-600); font-size: 14px; font-weight: 500;
  transition: all 0.15s; cursor: pointer; border: none; background: none; width: 100%; text-align: left;
}
.nav-item:hover { background: var(--gray-50); color: var(--primary); }
.nav-item.router-link-active { background: #eef2ff; color: var(--primary); font-weight: 600; }
.nav-icon { font-size: 18px; width: 24px; text-align: center; }

.sidebar-footer { padding: 12px 0; border-top: 1px solid var(--gray-100); }
.logout-btn { color: var(--danger) !important; }
.logout-btn:hover { background: #fef2f2 !important; }

.sidebar-backdrop { display: none; }

/* Main Content */
.main-content { flex: 1; margin-left: var(--sidebar-width); padding: 32px; min-height: 100vh; }

/* Mobile Header */
.mobile-header { display: none; }

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .sidebar-close { display: block; }
  .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 99; }
  .main-content { margin-left: 0; padding: 80px 16px 24px; }
  .mobile-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: white; border-bottom: 1px solid var(--gray-200);
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  }
  .menu-toggle { background: none; border: none; font-size: 24px; cursor: pointer; }
  .mobile-title { font-weight: 700; font-size: 18px; color: var(--primary); }
  .header-user { font-size: 13px; color: var(--gray-500); }
}
</style>

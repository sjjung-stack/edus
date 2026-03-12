<template>
  <div class="app-layout">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
        <span>☰</span>
      </button>
      <span class="mobile-title">🌈 배움터</span>
      <div class="header-user">{{ auth.profile?.full_name }}</div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🌈</span>
          <span class="logo-text">배움터</span>
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
  width: var(--sidebar-width);
  background: linear-gradient(180deg, #fff5f9 0%, #fff0f5 30%, #f0f0ff 70%, #e8fafe 100%);
  border-right: 3px solid rgba(255, 107, 157, 0.15);
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100; transition: transform 0.3s;
}
.sidebar-header {
  padding: 22px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 3px dashed rgba(255, 107, 157, 0.2);
}
.logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 32px; animation: wiggle 2s infinite; }
.logo-text { font-size: 22px; font-weight: 900; background: linear-gradient(135deg, #ff6b9d, #b07dff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sidebar-close { display: none; background: none; border: none; font-size: 28px; cursor: pointer; color: var(--gray-400); }

.sidebar-user {
  padding: 20px; display: flex; align-items: center; gap: 14px;
  border-bottom: 3px dashed rgba(255, 107, 157, 0.2);
}
.user-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #b07dff);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 20px;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
  animation: bounce 3s infinite;
}
.user-name { font-weight: 700; font-size: 15px; color: var(--gray-800); }
.user-role { margin-top: 4px; }

.sidebar-nav { flex: 1; overflow-y: auto; padding: 14px 12px; }
.nav-section {
  padding: 14px 12px 6px; font-size: 11px; font-weight: 800;
  text-transform: uppercase; color: var(--primary); letter-spacing: 1px;
}
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  color: var(--gray-700); font-size: 15px; font-weight: 600;
  transition: all 0.3s; cursor: pointer; border: none;
  background: none; width: 100%; text-align: left;
  border-radius: 14px; margin-bottom: 4px;
}
.nav-item:hover { background: rgba(255, 107, 157, 0.1); color: var(--primary); transform: translateX(4px); }
.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(176, 125, 255, 0.15));
  color: var(--primary-dark); font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.1);
}
.nav-icon { font-size: 22px; width: 28px; text-align: center; }

.sidebar-footer { padding: 12px; border-top: 3px dashed rgba(255, 107, 157, 0.2); }
.logout-btn { color: var(--danger) !important; }
.logout-btn:hover { background: rgba(255, 107, 107, 0.1) !important; }

.sidebar-backdrop { display: none; }

/* Main Content */
.main-content { flex: 1; margin-left: var(--sidebar-width); padding: 36px; min-height: 100vh; }

/* Mobile Header */
.mobile-header { display: none; }

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .sidebar-close { display: block; }
  .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(255, 150, 190, 0.2); backdrop-filter: blur(3px); z-index: 99; }
  .main-content { margin-left: 0; padding: 84px 16px 24px; }
  .mobile-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(135deg, #fff5f9, #f0f0ff);
    border-bottom: 3px solid rgba(255, 107, 157, 0.15);
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  }
  .menu-toggle { background: none; border: none; font-size: 26px; cursor: pointer; }
  .mobile-title { font-weight: 800; font-size: 18px; color: var(--primary); }
  .header-user { font-size: 13px; color: var(--gray-500); font-weight: 600; }
}

@keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
</style>

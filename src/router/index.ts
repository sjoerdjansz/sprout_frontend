import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import CheckEmailView from '@/views/CheckEmailView.vue'
import ConversationView from '@/views/ConversationView.vue'
import VerifyView from '@/views/VerifyView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Only for signed in users; others are sent to the login screen. */
    requiresAuth?: boolean
    /** Only for signed out users; signed in users are sent home. */
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/conversations/:id',
      name: 'conversation',
      component: ConversationView,
      // A non-numeric id becomes NaN, which the API answers with its not found message.
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUpView,
      meta: { guestOnly: true },
    },
    {
      path: '/check-email',
      name: 'check-email',
      component: CheckEmailView,
      meta: { guestOnly: true },
    },
    {
      // The magic link in the email points here (see ../API.md). Open to everyone, so a new
      // link also works while another account is still signed in on this device.
      path: '/auth/verify',
      name: 'verify',
      component: VerifyView,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router

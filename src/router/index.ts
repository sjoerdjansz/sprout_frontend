import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import CheckEmailView from '@/views/CheckEmailView.vue'
import ConversationView from '@/views/ConversationView.vue'
import VerifyView from '@/views/VerifyView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import KnowledgeMapView from '@/views/KnowledgeMapView.vue'
import SettingsView from '@/views/SettingsView.vue'
import EmailConfirmView from '@/views/EmailConfirmView.vue'
import ProfileSettings from '@/views/settings/ProfileSettings.vue'
import AiSettings from '@/views/settings/AiSettings.vue'
import SubtopicView from '@/views/SubtopicView.vue'
import PracticeSetupView from '@/views/PracticeSetupView.vue'
import PracticeSessionView from '@/views/PracticeSessionView.vue'

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
      path: '/knowledge-map',
      name: 'knowledge-map',
      component: KnowledgeMapView,
      meta: { requiresAuth: true },
    },
    {
      path: '/subtopics/:id',
      name: 'subtopic',
      component: SubtopicView,
      // A non-numeric id becomes NaN, which the API answers with its not found message.
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { requiresAuth: true },
    },
    {
      // Prefilled from the query: ?subtopic=26, ?topic=8 and ?modes=cards,retrieval.
      path: '/practice',
      name: 'practice',
      component: PracticeSetupView,
      meta: { requiresAuth: true },
    },
    {
      // Runs the plan the setup page made; without one it sends you back there.
      path: '/practice/session',
      name: 'practice-session',
      component: PracticeSessionView,
      meta: { requiresAuth: true },
    },
    {
      // One URL per section, so Back and reloading keep your place. Sections share the page's
      // menu and its loaded settings.
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      redirect: { name: 'settings-profile' },
      meta: { requiresAuth: true },
      children: [
        { path: 'profile', name: 'settings-profile', component: ProfileSettings },
        { path: 'ai', name: 'settings-ai', component: AiSettings },
      ],
    },
    {
      // The link in the email-change email points here (see ../API.md). Open to everyone: the
      // token is the proof, so it also works on a device where you aren't signed in.
      path: '/settings/email/confirm',
      name: 'settings-email-confirm',
      component: EmailConfirmView,
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
    {
      // Any URL the app doesn't know. Open to everyone, so a mistyped link never bounces you to
      // the login screen first.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
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

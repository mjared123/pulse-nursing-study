import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import ExamDashboard from './views/ExamDashboard.vue'
import TopicView from './views/TopicView.vue'
import QuizView from './views/QuizView.vue'
import PracticeExamView from './views/PracticeExamView.vue'
import ExamResults from './views/ExamResults.vue'
import NotFound from './views/NotFound.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to, from, saved) => saved ?? (to.hash ? { el: to.hash, top: 80 } : { top: 0 }),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/:examId', name: 'exam', component: ExamDashboard, props: true },
    { path: '/:examId/topic/:slug', name: 'topic', component: TopicView, props: true },
    { path: '/:examId/topic/:slug/quiz', name: 'quiz', component: QuizView, props: (r) => ({ ...r.params, mode: r.query.mode ?? 'random' }) },
    { path: '/:examId/practice/:n', name: 'practice', component: PracticeExamView, props: (r) => ({ examId: r.params.examId, n: Number(r.params.n) }) },
    { path: '/:examId/practice/:n/results', name: 'results', component: ExamResults, props: (r) => ({ examId: r.params.examId, n: Number(r.params.n), attempt: r.query.attempt != null ? Number(r.query.attempt) : null }) },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})

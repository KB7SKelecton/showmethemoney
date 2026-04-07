import { createRouter, createWebHistory } from 'vue-router';

import Home from '@/pages/Home.vue';
import List from '@/pages/List.vue';
import RegisterPage from '@/pages/RegisterPage.vue';
// import MyPage from '@/pages/MyPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/list', name: 'list', component: List },
    // { path: '/mypage', name: 'mypage', component: MyPage },
    { path: '/register', name: 'register', component: RegisterPage },
  ],
});

export default router;

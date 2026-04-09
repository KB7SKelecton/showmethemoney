<template>
  <div class="app-layout">
    <Header
      v-if="route.path !== '/login' && route.path !== '/register'"
      :user-name="userName"
      :user-profile-img="userProfileImg"
      @logout="handleLogout"
    />
    <Nav />
    <main class="main-content">
      <router-view></router-view>
    </main>
    <Register />
  </div>
</template>

<script>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import axios from 'axios';

/* 컴포넌트 */
import Header from '@/components/Header.vue';
import Nav from '@/components/Nav.vue';
import Register from './components/Register.vue';

export default {
  name: 'App',
  components: { Header, Nav, Register },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const userName = ref('');
    const userProfileImg = ref('');

    onMounted(async () => {
      const res = await axios.get('http://localhost:3000/users/1');
      userName.value = res.data.nickname;
      userProfileImg.value = res.data.profile_image_url;
    });
    const handleLogout = () => {
      localStorage.removeItem('user');
      router.push('/login');
    };

    return {
      route,
      handleLogout,
      userName,
      userProfileImg,
      router,
    };
  },
};
</script>

<style>
.app-layout {
  min-height: 100vh;
}
.main-content {
  background-color: #131313;
  width: calc(100% - 260px);
  float: right;
}
#app {
  background-color: #131313 !important;
}

@media (max-width: 767px) {
  .main-content {
    width: 100%;
    float: none;
    padding-bottom: 96px;
  }
  .fab-button {
    right: 16px;
    bottom: 88px;
    width: 52px;
    height: 52px;
    font-size: 26px;
  }
}
</style>

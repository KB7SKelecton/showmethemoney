<template>
  <nav class="side-nav">
    <div class="menu-group">
      <router-link to="/" class="nav-item">
        <i class="fas fa-calendar-alt icon"></i>
        <span>홈/달력</span>
      </router-link>

      <router-link to="/list" class="nav-item">
        <i class="fas fa-file-invoice-dollar icon"></i>
        <span>재정 내역</span>
      </router-link>

      <router-link to="/mypage" class="nav-item">
        <i class="fas fa-user-circle icon"></i>
        <span>마이페이지</span>
      </router-link>
    </div>
    <!-- 프로필 영역 -->
    <div class="profile-section">
      <div class="profile-avatar">
        <img v-if="user.avatar" :src="user.avatar" alt="프로필" />
        <i v-else class="fa-solid fa-user profile-default-icon"></i>
      </div>
      <p class="profile-name">{{ user.name }}</p>
      <p class="profile-email">{{ user.email }}</p>
    </div>
    <div class="logo-image">
      <img src="../assets/logo.png" alt="로고" />
    </div>
  </nav>
</template>

// axios 추가
<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const user = ref({
  name: "",
  email: "",
  avatar: "",
});

onMounted(async () => {
  const res = await axios.get("http://localhost:3000/users/1");
  user.value.name = res.data.nickname;
  user.value.email = res.data.email;
  user.value.avatar = res.data.profile_image_url;
});
</script>
<style scoped>
.side-nav {
  width: 260px;
  height: 100vh;
  background-color: #0d0d0d;
  border-right: 1px solid #222;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  z-index: 9998;
  position: fixed;
  left: 0;
}
.menu-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 30px;
  color: #888;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}
.nav-item.router-link-active {
  color: #fff;
  background: linear-gradient(
    90deg,
    rgba(255, 179, 71, 0.1) 0%,
    rgba(255, 179, 71, 0) 100%
  );
}
.nav-item.router-link-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #ffb347;
  box-shadow: 2px 0 12px rgba(255, 179, 71, 0.6);
  z-index: 5;
}
.nav-item.router-link-active .icon {
  color: #ffb347;
  filter: drop-shadow(0 0 5px rgba(255, 179, 71, 0.3));
}
.nav-item.router-link-active span {
  color: #ffffff;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
  margin-bottom: 12px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffca82, #f8a70c, #ffd483);
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #131313;
}

.profile-default-icon {
  color: #888;
  font-size: 2rem;
}

.profile-name {
  color: #e5e2e1;
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}

.profile-email {
  color: #e5e2e1;
  font-size: 0.75rem;
  margin: 0;
  opacity: 0.5;
}
.logo-image {
  width: 200px;
}
.logo-image img {
  width: 100%;
  filter: grayscale(1);
  opacity: 0.3;
}
</style>

<template>
  <div class="mypage">
    <!-- 왼쪽 메인 영역 -->
    <div class="mypage-main">
      <!-- 마이페이지 헤더 박스 (제목 + 잔고) -->
      <div class="mypage-header">
        <h1 class="mypage-title">마이페이지</h1>
        <div class="mypage-balance">
          <span class="balance-label">AVAILABLE ASSETS</span>
          <!-- toLocaleString(): 숫자에 쉼표 자동으로 붙여줌 (5500000 → 5,500,000) -->
          <span class="balance-amount"
            >잔고 : {{ balance.toLocaleString() }}원</span
          >
        </div>
      </div>
    </div>

    <!-- 오른쪽 사이드바 -->
    <div class="mypage-sidebar">
      <!-- 사이드바 위쪽: 프로필 영역 -->
      <div class="sidebar-top">
        <!-- 프로필 이미지: 클릭하면 숨겨진 파일 input 실행 -->
        <div class="profile-avatar" @click="$refs.avatarInput.click()">
          <!-- avatar 값 있으면 이미지 표시, 없으면 기본 사람 아이콘 표시 -->
          <img v-if="user.avatar" :src="user.avatar" alt="프로필" />
          <i v-else class="fa-solid fa-user profile-default-icon"></i>
          <!-- 호버 시 나타나는 카메라 아이콘 오버레이 -->
          <div class="avatar-overlay">
            <i class="fa-solid fa-camera"></i>
          </div>
        </div>

        <!-- 숨겨진 파일 input: profile-avatar 클릭 시 여기가 실행됨 -->
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onAvatarChange"
        />

        <!-- 이름: isEditingName이 false면 텍스트, true면 input으로 바뀜 -->
        <p v-if="!isEditingName" class="profile-name" @click="startEdit">
          {{ user.name }} <i class="fa-solid fa-pen"></i>
        </p>
        <!-- 이름 수정 input: blur(바깥클릭) 또는 Enter 입력 시 finishEdit 실행 -->
        <input
          v-else
          class="profile-name-input"
          v-model="user.name"
          @blur="finishEdit"
          @keyup.enter="finishEdit"
          autofocus
        />

        <!-- 이메일: isEditingEmail이 false면 텍스트, true면 input으로 바뀜 -->
        <p v-if="!isEditingEmail" class="profile-email" @click="startEditEmail">
          {{ user.email }} <i class="fa-solid fa-pen"></i>
        </p>
        <!-- 이메일 수정 input: blur(바깥클릭) 또는 Enter 입력 시 finishEditEmail 실행 -->
        <input
          v-else
          class="profile-email-input"
          v-model="user.email"
          @blur="finishEditEmail"
          @keyup.enter="finishEditEmail"
          autofocus
        />
      </div>

      <!-- 사이드바 아래쪽: 로그아웃 버튼 영역 -->
      <div class="sidebar-bottom">
        <button class="logout-btn" @click="logout">↪ 로그아웃</button>
        <p class="secured-text">SECURED BY Show Me The Money</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

function logout() {
  router.push("/"); // 홈으로 이동하지만 나중에 로그인 페이지로 바꿀 예정("/login")
}
import { ref } from "vue";

// 잔고 (나중에 axios로 json-server에서 받아올 예정)
const balance = ref(5500000);

// 유저 정보 (나중에 axios로 json-server에서 받아올 예정)
const user = ref({
  name: "홍길동",
  email: "hgj1234@gmail.com",
  avatar: "", // 프로필 이미지 (없으면 기본 아이콘 표시)
});

// 이름 수정 모드 여부 (true: input 표시, false: 텍스트 표시)
const isEditingName = ref(false);

// 이메일 수정 모드 여부 (true: input 표시, false: 텍스트 표시)
const isEditingEmail = ref(false);

// 이름 수정 시작: 텍스트 클릭 시 실행
function startEdit() {
  isEditingName.value = true;
}

// 이름 수정 완료: Enter 또는 바깥 클릭 시 실행
function finishEdit() {
  isEditingName.value = false;
}

// 이메일 수정 시작: 텍스트 클릭 시 실행
function startEditEmail() {
  isEditingEmail.value = true;
}

// 이메일 수정 완료: Enter 또는 바깥 클릭 시 실행
function finishEditEmail() {
  isEditingEmail.value = false;
}

// 프로필 이미지 변경
// FileReader로 선택한 이미지를 base64로 변환해서 user.avatar에 저장
function onAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return; // 파일 선택 안 했으면 종료
  const reader = new FileReader();
  reader.onload = (e) => {
    user.value.avatar = e.target.result; // base64 이미지 저장
  };
  reader.readAsDataURL(file); // 파일을 base64로 변환 시작
}
</script>

<style scoped>
/* 전체 레이아웃: 좌우로 나란히 배치 */
.mypage {
  display: flex;
  gap: 0;
  min-height: 100vh; /* 화면 전체 높이 채우기 */
  background-color: #111;
  padding: 0;
}

/* 왼쪽 메인 영역: 나머지 공간 전부 차지 */
.mypage-main {
  flex: 1;
  padding: 32px 24px;
}

/* 마이페이지 헤더 박스 */
.mypage-header {
  background-color: #1a1a1a;
  border-radius: 10px;
  padding: 24px 28px;
}

/* 마이페이지 제목 */
.mypage-title {
  font-size: 2.2rem;
  font-weight: bold;
  color: white;
  margin: 0 0 16px 0;
}

/* 잔고 표시 박스 */
.mypage-balance {
  background-color: #2a2a2a;
  border-radius: 6px;
  padding: 10px 18px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

/* AVAILABLE ASSETS 라벨 */
.balance-label {
  font-size: 0.7rem;
  color: #888;
  letter-spacing: 0.08em;
}

/* 잔고 금액 */
.balance-amount {
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
}

/* 오른쪽 사이드바: 고정 너비, 화면 전체 높이 */
.mypage-sidebar {
  width: 220px;
  min-height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column; /* 요소들 위→아래로 쌓기 */
  justify-content: flex-start;
  align-items: center; /* 가운데 정렬 */
  padding: 40px 16px 24px;
  border-left: 1px solid #2a2a2a;
}

/* 사이드바 위쪽 프로필 영역 */
.sidebar-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* 프로필 이미지 원형 컨테이너 */
.profile-avatar {
  position: relative; /* avatar-overlay 절대 위치 기준점 */
  width: 90px;
  height: 90px;
  border-radius: 50%; /* 원형 */
  border: 3px solid #f5a623; /* 노란 테두리 */
  overflow: hidden; /* 원 밖으로 삐져나오는 이미지 숨기기 */
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 프로필 이미지 */
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 이미지 비율 유지하며 꽉 채우기 */
}

/* 이미지 없을 때 기본 사람 아이콘 */
.profile-default-icon {
  color: #888;
  font-size: 2.5rem;
}

/* 호버 시 나타나는 카메라 오버레이 */
.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  opacity: 0; /* 평소엔 투명 */
  transition: opacity 0.2s;
}

/* 호버 시 오버레이 나타남 */
.profile-avatar:hover .avatar-overlay {
  opacity: 1;
}

/* 카메라 아이콘 */
.avatar-overlay i {
  color: white;
  font-size: 0.8rem;
}

/* 이름 텍스트 */
.profile-name {
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0;
  cursor: pointer; /* 클릭 가능 표시 */
}

/* 이름/이메일 옆 펜 아이콘 */
.profile-name i,
.profile-email i {
  font-size: 0.7rem;
  color: #888;
  margin-left: 4px;
}

/* 이메일 텍스트 */
.profile-email {
  color: #888;
  font-size: 0.75rem;
  margin: 0;
  cursor: pointer; /* 클릭 가능 표시 */
}

/* 이름 수정 input */
.profile-name-input {
  background-color: #2a2a2a;
  border: 1px solid #f5a623;
  border-radius: 6px;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  padding: 4px 8px;
  width: 100%;
  outline: none;
}

/* 이메일 수정 input */
.profile-email-input {
  background-color: #2a2a2a;
  border: 1px solid #f5a623;
  border-radius: 6px;
  color: #888;
  font-size: 0.75rem;
  text-align: center;
  padding: 4px 8px;
  width: 100%;
  outline: none;
}

/* 사이드바 아래쪽: 로그아웃 버튼 영역 */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 600px; /* 로그아웃 버튼 아래로 밀기 */
}

/* 로그아웃 버튼 */
.logout-btn {
  width: 100%;
  padding: 12px;
  background-color: #2a2a2a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

/* 로그아웃 버튼 호버 */
.logout-btn:hover {
  background-color: #3a3a3a;
}

/* 하단 보안 텍스트 */
.secured-text {
  font-size: 0.6rem;
  color: #444;
  text-align: center;
  margin: 0;
  letter-spacing: 0.05em;
}
</style>

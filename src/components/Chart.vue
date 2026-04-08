<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
);

const isLoaded = ref(false);
const rawData = ref({ transactions: [], categories: [] });
const currentDate = ref(new Date(2026, 3, 8));

const colors = ['#f8a70c', '#fab809', '#6e6053', '#8b7e74', '#4a443f'];

const fetchData = async () => {
  try {
    const response = await axios.get('http://localhost:3000/db');
    rawData.value = response.data;
    isLoaded.value = true;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }
};

onMounted(fetchData);

const dashboardData = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const monthlyMap = {};
  for (let i = 3; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}월`;
    monthlyMap[key] = { income: 0, expense: 0 };
  }

  rawData.value.transactions.forEach((t) => {
    const d = new Date(t.transaction_date);
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}월`;
    if (monthlyMap[key]) {
      if (t.type === 'INCOME') monthlyMap[key].income += t.amount;
      else monthlyMap[key].expense += t.amount;
    }
  });

  const barLabels = Object.keys(monthlyMap);
  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: '수입',
        backgroundColor: '#f8a70c',
        data: barLabels.map((m) => monthlyMap[m].income),
        borderRadius: 8,
        barThickness: 45,
      },
      {
        label: '지출',
        backgroundColor: '#6e6053',
        data: barLabels.map((m) => monthlyMap[m].expense),
        borderRadius: 8,
        barThickness: 45,
      },
    ],
  };

  const currentTransactions = rawData.value.transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return (
      d.getFullYear() === year && d.getMonth() === month && t.type === 'EXPENSE'
    );
  });

  const expenseByCat = {};
  rawData.value.categories.forEach(
    (c) => (expenseByCat[c.id] = { name: c.name, amount: 0 }),
  );

  let total = 0;
  currentTransactions.forEach((t) => {
    if (expenseByCat[t.category_id]) {
      expenseByCat[t.category_id].amount += t.amount;
      total += t.amount;
    }
  });

  const sortedList = Object.values(expenseByCat)
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((item, idx) => ({
      ...item,
      percent: total > 0 ? Math.round((item.amount / total) * 100) : 0,
      color: colors[idx % colors.length],
    }));

  const doughnutChartData = {
    labels: sortedList.map((i) => i.name),
    datasets: [
      {
        data: sortedList.map((i) => i.amount),
        backgroundColor: sortedList.map((i) => i.color),
        cutout: '80%',
        borderWidth: 0,
      },
    ],
  };

  return { barChartData, doughnutChartData, total, sortedList };
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      align: 'end',
      labels: {
        color: '#ffffff',
        usePointStyle: true,
        boxWidth: 8,
        font: { size: 14, weight: '600' },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#bbbbbb', font: { size: 14, weight: '600' } },
    },
    y: { display: false },
  },
};

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: (chart) => {
    const {
      ctx,
      chartArea: { top, width, height },
    } = chart;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "총 지출액" - 색상을 더 밝게, 크기를 키움
    ctx.fillStyle = '#bbbbbb';
    ctx.font = '600 1.1rem "Pretendard", sans-serif';
    ctx.fillText('총 지출액', width / 2, top + height / 2 - 22);

    // 금액 숫자 - 화이트로 명확하게
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 2rem "Pretendard", sans-serif';
    ctx.fillText(
      `${dashboardData.value.total.toLocaleString()}원`,
      width / 2,
      top + height / 2 + 18,
    );
    ctx.restore();
  },
};

const changeMonth = (offset) => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + offset);
  currentDate.value = newDate;
};
</script>

<template>
  <div v-if="isLoaded" class="dashboard-container">
    <section class="card bar-section">
      <div class="card-header">
        <div class="title-group">
          <h3>월별 지출 및 수입</h3>
          <p class="subtitle">최근 4개월간의 자산 흐름</p>
        </div>
        <div class="month-nav">
          <button @click="changeMonth(-1)" class="nav-btn">◀</button>
          <span class="nav-date"
            >{{ currentDate.getFullYear() }}년
            {{ String(currentDate.getMonth() + 1).padStart(2, '0') }}월</span
          >
          <button @click="changeMonth(1)" class="nav-btn">▶</button>
        </div>
      </div>
      <div class="chart-content main-bar">
        <Bar :data="dashboardData.barChartData" :options="barOptions" />
      </div>
    </section>

    <div class="bottom-grid">
      <section class="card doughnut-section">
        <div class="card-header">
          <div class="title-group">
            <h3>카테고리별 지출</h3>
            <p class="highlight">
              {{ currentDate.getFullYear() }}년
              {{ String(currentDate.getMonth() + 1).padStart(2, '0') }}월 기준
            </p>
          </div>
        </div>
        <div class="chart-content donut-box">
          <Doughnut
            :data="dashboardData.doughnutChartData"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }"
            :plugins="[centerTextPlugin]"
          />
        </div>
      </section>

      <section class="card list-section">
        <div class="card-header">
          <h3>지출 상세 내역</h3>
        </div>
        <ul class="detail-list">
          <li v-for="item in dashboardData.sortedList" :key="item.name">
            <div class="list-left">
              <span class="dot" :style="{ backgroundColor: item.color }"></span>
              <span class="cat-name">{{ item.name }}</span>
            </div>
            <div class="list-right">
              <span class="percent">{{ item.percent }}%</span>
              <span class="amount">{{ item.amount.toLocaleString() }}원</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
  <div v-else class="loading-state">데이터를 불러오는 중입니다...</div>
</template>

<style scoped>
.dashboard-container {
  background-color: #000;
  color: #ffffff; /* 기본 글자색을 완전 화이트로 */
  padding: 40px;
  font-family:
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    system-ui,
    sans-serif;
  line-height: 1.6; /* 행간을 넓혀 가독성 확보 */
}

.card {
  background-color: #1a1a1a; /* 카드 배경을 약간 밝게 하여 대비 명확화 */
  border-radius: 24px;
  padding: 35px;
  border: 1px solid #333;
  margin-bottom: 30px;
}

/* 제목 및 텍스트 계층 구조 */
h3 {
  font-size: 1.5rem; /* 제목 크기 확대 */
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
}

.subtitle {
  color: #aaaaaa; /* 부제목도 조금 더 밝게 */
  font-size: 1rem;
  margin-top: 6px;
}

.highlight {
  color: #ffb421; /* 골드 색상 채도를 높임 */
  font-size: 1.1rem;
  font-weight: 700;
}

/* 네비게이션 가독성 */
.nav-date {
  font-weight: 800;
  font-size: 1.3rem; /* 날짜 크기 확대 */
  color: #ffffff;
}

.nav-btn {
  font-size: 1.2rem;
  color: #ffb421;
  padding: 5px 10px;
}

/* 상세 리스트 가독성 (가장 중요한 부분) */
.detail-list li {
  padding: 22px 0;
  border-bottom: 1px solid #2a2a2a;
}

.cat-name {
  font-size: 1.2rem; /* 카테고리명 확대 */
  font-weight: 600;
  color: #f0f0f0;
}

.percent {
  font-size: 1.4rem; /* 퍼센트 수치 강조 */
  font-weight: 800;
  color: #ffb421;
  margin-right: 15px;
}

.amount {
  font-size: 1.25rem; /* 금액 크기 확대 */
  color: #ffffff;
  font-weight: 700;
  min-width: 110px;
  display: inline-block;
  text-align: right;
}

/* 로딩 상태 */
.loading-state {
  color: #ffffff;
  font-weight: 600;
  font-size: 1.2rem;
}
</style>

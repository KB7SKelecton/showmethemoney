<template>
  <!-- 
    List 컴포넌트 루트
    - list-screen: 전체 페이지 래퍼
    - list-panel: 내역 목록 영역
    - Teleport: 모달을 body에 마운트 (z-index 스택 문제 방지)
   -->
  <div class="list-screen">
    <div class="list-panel">
      <header class="page-head">
        <h1 class="page-title">내역</h1>
        <nav class="list-tabs" role="tablist" aria-label="내역 보기 방식"> <!-- role="tablist": 탭 그룹임을 스크린리더에 알림 -->
          <button
            type="button"
            role="tab" 
            class="list-tab"
            :class="{ 'list-tab--active': activeTab === 'category' }" 
            :aria-selected="activeTab === 'category'"
            @click="activeTab = 'category'"
          >
            카테고리별 내역
          </button>
          <button
            type="button"
            role="tab"
            class="list-tab"
            :class="{ 'list-tab--active': activeTab === 'month' }"
            :aria-selected="activeTab === 'month'"
            @click="activeTab = 'month'"
          >
            월별 내역
          </button>
          <button
            type="button"
            role="tab"
            class="list-tab"
            :class="{ 'list-tab--active': activeTab === 'day' }"
            :aria-selected="activeTab === 'day'"
            @click="activeTab = 'day'"
          >
            일별 내역
          </button>
        </nav>
      </header>
 
      <!-- 
        상태별 조건부 렌더링 (v-if / v-else-if 체인)
        1. loading: 데이터 로드 중
        2. error: API 호출 실패
        3. activeUserId == null: users 테이블이 비어있는 경우
        4. !panelGroups.length: 필터 결과가 없는 경우
        5. else: 정상 데이터 출력
       -->
      <div v-if="loading" class="state-msg">불러오는 중…</div> <!-- 1순위: API 호출 중일 때 -->
      <div v-else-if="error" class="state-msg state-err">{{ error }}</div>  <!-- 2순위: API 호출 실패 시 에러 메시지 -->
      <p v-else-if="activeUserId == null" class="state-msg state-err"> <!-- 3순위: users 테이블이 비어있는 경우 -->

        users 데이터가 없어 내역을 표시할 수 없습니다.
      </p>
      <p v-else-if="!panelGroups.length" class="state-msg">표시할 내역이 없습니다.</p> <!-- 4순위: 거래 데이터가 없는 경우 -->
 
      <!-- 
        정상 데이터 렌더링
        - <template v-else> : 실제 DOM 요소를 추가하지 않는 논리 래퍼
        - panelGroups: activeTab에 따라 category / month / day 그룹 반환하는 computed
        - :key="group.key" : Vue diffing 알고리즘 최적화를 위한 고유 키
       -->
        <!-- panelGroups: activeTab에 따라 카테고리/월/일 그룹 중 하나 반환 -->
      <template v-else>
        <div
          v-for="group in panelGroups"
          :key="group.key" 
          class="ledger-block"
        >
          <!-- 그룹 요약 헤더
               - ledger-icon: 카테고리/월/일 대표 이모지
               - ledger-title: 그룹명 (카테고리명 | 연월 | 날짜)
               - ledger-sub: 영문 부제 또는 형식 문자열
               - sum--income / sum--expense: 해당 그룹 합계 표시
                 (v-if로 0원 항목은 렌더링 생략)
          -->
          <div class="ledger-head">
            <div class="ledger-icon" aria-hidden="true">{{ group.icon }}</div>
            <div class="ledger-labels">
              <span class="ledger-title">{{ group.title }}</span>
              <span class="ledger-sub">{{ group.subtitle }}</span>
            </div>
            <div class="ledger-totals">
              <span v-if="group.incomeTotal > 0" class="sum sum--income">
                + {{ formatWon(group.incomeTotal) }}원
              </span>
              <span v-if="group.expenseTotal > 0" class="sum sum--expense">
                - {{ formatWon(group.expenseTotal) }}원
              </span>
            </div>
          </div>
 
          <!-- 거래 목록 (ul > li)
               - role="button" + tabindex="0": 클릭 가능한 li를 키보드 접근 가능하게 처리
               - @keydown.enter.prevent / @keydown.space.prevent: 키보드 활성화 지원
               - openDetail(tx): 클릭 시 상세/수정 모달 오픈
               - tx-row--income / tx-row--expense: 수입·지출 스타일 분기
          -->
          <ul class="tx-list">
            <li
              v-for="tx in group.items"
              :key="tx.id"
              class="tx-row"
              :class="tx.type === 'INCOME' ? 'tx-row--income' : 'tx-row--expense'"
              role="button"
              tabindex="0"
              @click="openDetail(tx)"
              @keydown.enter.prevent="openDetail(tx)"
              @keydown.space.prevent="openDetail(tx)"
            >
              <!-- 거래일 표시 (MM/DD + 요일) -->
              <div class="tx-date">
                <span>{{ formatDateParts(tx.transaction_date).mmdd }}</span>
                <span class="tx-subdate">{{ formatDateParts(tx.transaction_date).sub }}</span>
              </div>
 
              <!-- 거래 내용: 배지(수입/지출) + 메모 + 카테고리명
                   - showCategoryMeta: 카테고리별 탭이 아닐 때만 카테고리명 표시
              -->
              <div class="tx-body">
                <span class="tx-badge">{{ tx.type === 'INCOME' ? '수입' : '지출' }}</span>
                <span class="tx-title">{{ tx.memo || '내역' }}</span>
                <span v-if="showCategoryMeta" class="tx-meta">{{ categoryName(tx.category_id) }}</span>
              </div>
 
              <!-- 금액 표시: +/- 기호와 함께 포맷팅 -->
              <div
                class="tx-amount"
                :class="
                  tx.type === 'INCOME' ? 'tx-amount--income' : 'tx-amount--expense'
                "
              >
                {{ formatTxAmount(tx.amount, tx.type) }}
              </div>
            </li>
          </ul>
        </div>
      </template>
    </div>
 
    <!-- 
      상세/수정 모달
      - <Teleport to="body">: 모달을 DOM 트리 최상단(body)에 렌더링
        → 부모 컴포넌트의 overflow:hidden, z-index 등에 영향받지 않음
      - @click.self="closeDetail": 백드롭 클릭 시 닫기
        (.self 수정자: 이벤트 발생 요소가 자기 자신일 때만 실행)
      - @click.stop: 모달 내부 클릭이 백드롭으로 버블링되는 것 차단
      - role="dialog" + aria-modal + aria-labelledby: 접근성 속성
     -->
    <Teleport to="body">
      <div
        v-if="detailOpen"
        class="tx-modal-backdrop"
        aria-hidden="false"
        @click.self="closeDetail"
      >
        <div
          class="tx-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
          @click.stop
        >
          <!-- 모달 헤더: 제목 + 닫기 버튼 -->
          <div class="tx-modal-head">
            <h2 id="tx-modal-title" class="tx-modal-title">내역 상세</h2>
            <button
              type="button"
              class="tx-modal-close"
              aria-label="닫기"
              @click="closeDetail"
            >
              ×
            </button>
          </div>

          <form class="tx-modal-form" @submit.prevent="saveDetail">
            <!-- 구분 선택 (수입/지출) -->
            <div class="tx-modal-field">
              <label class="tx-modal-label" for="txm-type">구분</label>
              <select
                id="txm-type"
                v-model="detailForm.type"
                class="tx-modal-input"
                required
              >
                <option value="INCOME">수입</option>
                <option value="EXPENSE">지출</option>
              </select>
            </div>
 
            <!-- 금액 입력
                 - :value (단방향 바인딩) + @input (수동 처리): 커서 위치 보존을 위해
                   v-model 대신 수동 이벤트 처리 방식 사용
                 - inputmode="numeric": 모바일에서 숫자 키패드 표시
                 - lang="en": 일부 브라우저에서 쉼표 렌더링 오류 방지
            -->
            <div class="tx-modal-field">
              <label class="tx-modal-label" for="txm-amount">금액</label>
              <input
                id="txm-amount"
                :value="detailForm.amount"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                class="tx-modal-input"
                lang="en"
                required
                @beforeinput="onDetailAmountBeforeInput"
                @input="onDetailAmountInput"
                @compositionend="onDetailAmountCompositionEnd"
              />
            </div>
 
            <!-- 거래일 선택 -->
            <div class="tx-modal-field">
              <label class="tx-modal-label" for="txm-date">거래일</label>
              <input
                id="txm-date"
                v-model="detailForm.transaction_date"
                type="date"
                class="tx-modal-input"
                required
              />
            </div>
 
            <!-- 카테고리 선택
                 - categories ref: API에서 불러온 카테고리 목록
                 - v-model.number: 선택값을 숫자(id)로 변환
            -->
            <div class="tx-modal-field">
              <label class="tx-modal-label" for="txm-cat">카테고리</label>
              <select
                id="txm-cat"
                v-model.number="detailForm.category_id"
                class="tx-modal-input"
                required
              >
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
 
            <!-- 메모 입력 -->
            <div class="tx-modal-field">
              <label class="tx-modal-label" for="txm-memo">메모</label>
              <textarea
                id="txm-memo"
                v-model="detailForm.memo"
                class="tx-modal-input tx-modal-textarea"
                rows="3"
                placeholder="내용"
              />
            </div>
 
            <!-- 저장/삭제 결과 메시지 -->
            <p v-if="detailSaveErr" class="tx-modal-err">{{ detailSaveErr }}</p>
            <p v-if="detailSaveOk" class="tx-modal-ok">저장되었습니다.</p>
 
            <!-- 액션 버튼 영역
                 - :disabled: 저장 중이거나 삭제 중일 때 모든 버튼 비활성화 (중복 요청 방지)
                 - tx-modal-btn--danger: 삭제 버튼 (빨간색)
                 - tx-modal-btn--ghost: 닫기 버튼 (테두리만)
                 - tx-modal-btn--primary: 저장 버튼 (주 색상)
            -->
            <div class="tx-modal-actions">
              <button
                type="button"
                class="tx-modal-btn tx-modal-btn--danger"
                :disabled="detailSaving || detailDeleting"
                @click="deleteDetail"
              >
                {{ detailDeleting ? '삭제 중…' : '삭제' }}
              </button>
              <div class="tx-modal-actions-right">
                <button
                  type="button"
                  class="tx-modal-btn tx-modal-btn--ghost"
                  :disabled="detailSaving || detailDeleting"
                  @click="closeDetail"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  class="tx-modal-btn tx-modal-btn--primary"
                  :disabled="detailSaving || detailDeleting"
                >
                  {{ detailSaving ? '저장 중…' : '저장' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
 
<script setup>
/**
 * 주요 기능:
 *  1. 탭별 그룹핑: 카테고리별 / 월별 / 일별
 *  2. 거래 상세 모달: 조회·수정·삭제
 *  3. 금액 입력 포맷팅: 천 단위 쉼표 + 커서 위치 보존
 *  4. 웹 접근성: ARIA 속성, 키보드 탐색 지원
 *
 * 데이터 흐름:
 *  API (json-server:3000) → axios → transactions / categories / users ref
 *  → userTransactions (computed) → categoryGroups / monthGroups / dayGroups (computed)
 *  → panelGroups (computed, activeTab 기반) → 템플릿 렌더링
 */
 
import {
  ref,
  computed,
  reactive,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue';
import axios from 'axios';
 
// ─── 상수 ───────────────
 
/** Vite 개발 서버 프록시 설정을 통해 localhost:3000 으로 포워딩 */
const API_BASE = '/api';
 

const CATEGORY_UI = {
  1: { en: 'ADMIN',        icon: '📋' },
  2: { en: 'EDUCATION',    icon: '📚' },
  3: { en: 'TRANSPORT',    icon: '🚌' },
  4: { en: 'SHOPPING',     icon: '🛍️' },
  5: { en: 'TRAVEL',       icon: '✈️' },
  6: { en: 'FOOD & DINING',icon: '🍔' },
  7: { en: 'CONVENIENCE',  icon: '🏪' },
  8: { en: 'BUSINESS',     icon: '💼' },
};
 
// ─── 반응형 상태 (ref / reactive) ─────────────────────────────────────────────
 
/** 현재 활성 탭: 'category' | 'month' | 'day' */
const activeTab = ref('category');
 
/** API 로딩 중 여부 */
const loading   = ref(true);
 
/** API 에러 메시지 (없으면 null) */
const error     = ref(null);
 
/** API에서 받아온 전체 거래 내역 배열 */
const transactions = ref([]);
 
/** API에서 받아온 카테고리 목록 */
const categories   = ref([]);
 
/**
 * 현재 활성 사용자 ID.
 * users API의 첫 번째 레코드를 기본 사용자로 사용.
 * null이면 데이터 없음 상태 메시지 표시.
 */
const activeUserId = ref(null);
 
// ─── 모달 상태 ───────────
 
/** 상세 모달 표시 여부 */
const detailOpen     = ref(false);
 
/** 현재 편집 중인 거래 ID */
const editingId      = ref(null);
 
/** 저장 API 호출 중 여부 (버튼 비활성화, 로딩 텍스트용) */
const detailSaving   = ref(false);
 
/** 삭제 API 호출 중 여부 */
const detailDeleting = ref(false);
 
/** 저장/삭제 에러 메시지 */
const detailSaveErr  = ref(null);
 
/** 저장 성공 메시지 표시 여부 */
const detailSaveOk   = ref(false);
 
/**
 * 모달 폼 데이터 객체.
 * reactive()를 사용하여 중첩 속성 변경도 감지.
 * (ref()는 .value 접근 필요, reactive()는 직접 접근 가능)
 */
const detailForm = reactive({
  type:             'EXPENSE',
  amount:           '',       // 쉼표 포함 문자열 (예: "1,234,567")
  transaction_date: '',
  category_id:      1,
  memo:             '',
});
 
// ─── 금액 입력 유틸리티 ───
// 숫자만 받기
function formatDetailAmountDigits(digits) {
  if (!digits) return '';
  const normalized = digits.replace(/^0+/, '') || '0';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function countDigitsLeftOfCursor(str, cursorPos) {
  return String(str).slice(0, cursorPos).replace(/\D/g, '').length;
}
 
// 음수 불가
function cursorPosAfterDigitCount(formatted, digitCount) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen += 1;
    if (seen >= digitCount) return i + 1;
  }
  return formatted.length;
}
 

function syncDetailAmountFromInputEl(input) {
  const prev       = detailForm.amount;
  const caret      = input.selectionStart ?? prev.length;
  const digitsLeft = countDigitsLeftOfCursor(prev, caret);
 
  const digitsOnly = String(input.value).replace(/\D/g, '');
  const next       = digitsOnly === '' ? '' : formatDetailAmountDigits(digitsOnly);
  detailForm.amount = next;
 
  nextTick(() => {
    const pos = cursorPosAfterDigitCount(next, digitsLeft);
    input.setSelectionRange(pos, pos);
  });
}
 

function onDetailAmountBeforeInput(e) {
  const t = e.inputType;
  if (
    t !== 'insertText' &&
    t !== 'insertCompositionText' &&
    t !== 'insertReplacementText'
  ) {
    return; // 삭제/붙여넣기 등은 별도 처리 없이 통과
  }
  const d = e.data;
  if (d == null || d === '') return;
  // 숫자 외 문자가 포함되어 있으면 이벤트를 취소하여 입력 자체를 막음
  if (/[^\d]/.test(d)) {
    e.preventDefault();
  }
}
 

function onDetailAmountInput(e) {
  syncDetailAmountFromInputEl(e.target);
}
 

function onDetailAmountCompositionEnd(e) {
  syncDetailAmountFromInputEl(e.target);
}
 
function openDetail(tx) {
  editingId.value = tx.id;
  detailForm.type = tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
 
  // 금액: DB에는 숫자로 저장되어 있으므로 문자열로 변환 후 쉼표 포맷 적용
  const raw = tx.amount != null && tx.amount !== ''
    ? String(tx.amount).replace(/\D/g, '')
    : '';
  detailForm.amount = raw === '' ? '' : formatDetailAmountDigits(raw);
 
  detailForm.transaction_date = tx.transaction_date || '';
  // category_id: 숫자 강제변환, 없으면 첫 번째 카테고리 또는 1 사용
  detailForm.category_id = Number(tx.category_id) || categories.value[0]?.id || 1;
  detailForm.memo = tx.memo ?? '';
 
  // 이전 저장/오류 메시지 초기화
  detailSaveErr.value = null;
  detailSaveOk.value  = false;
  detailOpen.value    = true;
}
 
/** 상세 모달 닫기 및 편집 상태 초기화 */
function closeDetail() {
  detailOpen.value  = false;
  editingId.value   = null;
  detailSaveErr.value = null;
  detailSaveOk.value  = false;
}
 
// ─── 저장/삭제 ───────────
 
/**
 * 쉼표 포함 금액 문자열을 정수로 파싱.
 * '1,234,567' → 1234567 / '' → NaN
 * @param {string} text
 * @returns {number}
 */
function parseAmountFromText(text) {
  const cleaned = String(text).replace(/,/g, '').replace(/\s/g, '');
  if (cleaned === '') return NaN;
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : NaN;
}
 
/**
 * 폼 저장: PATCH /api/transactions/:id
 * - 금액 유효성 검사 후 API 호출
 * - 성공 시 목록 새로고침
 * - 저장 중 버튼 비활성화로 중복 제출 방지
 */
async function saveDetail() {
  const id = editingId.value;
  if (id == null) return;
 
  detailSaveErr.value = null;
  detailSaveOk.value  = false;
 
  const amountNum = parseAmountFromText(detailForm.amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    detailSaveErr.value = '금액을 0 이상의 숫자로 입력해 주세요.';
    return;
  }
 
  detailSaving.value = true;
  try {
    await axios.patch(`${API_BASE}/transactions/${id}`, {
      type:             detailForm.type,
      amount:           amountNum,
      transaction_date: detailForm.transaction_date,
      category_id:      Number(detailForm.category_id),
      memo:             detailForm.memo,
    });
    detailSaveOk.value = true;
    await loadData(); // 목록 전체 갱신
  } catch {
    detailSaveErr.value = '저장에 실패했습니다.';
  } finally {
    detailSaving.value = false;
  }
}
 
/**
 * 거래 삭제: DELETE /api/transactions/:id
 * - confirm()으로 사용자 확인 후 진행
 * - 성공 시 모달 닫고 목록 갱신
 */
async function deleteDetail() {
  const id = editingId.value;
  if (id == null) return;
  if (!confirm('이 내역을 삭제할까요?')) return;
 
  detailDeleting.value = true;
  detailSaveErr.value  = null;
  try {
    await axios.delete(`${API_BASE}/transactions/${id}`);
    closeDetail();
    await loadData();
  } catch {
    detailSaveErr.value = '삭제에 실패했습니다.';
  } finally {
    detailDeleting.value = false;
  }
}
 
/**
 * document 레벨 keydown 핸들러: Escape 키로 모달 닫기.
 * onMounted에서 addEventListener, onUnmounted에서 removeEventListener.
 */
function onDocKeydown(e) {
  if (e.key === 'Escape' && detailOpen.value) {
    e.preventDefault();
    closeDetail();
  }
}
 
/**
 * 모달 열림 상태 감시: 모달이 열리면 body 스크롤 잠금, 닫히면 해제.
 * watch(source, callback): source가 변경될 때 callback 실행.
 */
watch(detailOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});
 
/** 컴포넌트 언마운트 시 이벤트 리스너 제거 및 스크롤 잠금 해제 */
onUnmounted(() => {
  document.removeEventListener('keydown', onDocKeydown);
  document.body.style.overflow = '';
});
 

const showCategoryMeta = computed(() => activeTab.value !== 'category');
 

const catById = computed(
  () => new Map(categories.value.map((c) => [c.id, c])),
);
 

function categoryName(cid) {
  return catById.value.get(cid)?.name ?? '—';
}

function uiForCategory(cat, id) {
  const u    = CATEGORY_UI[id];
  const base = u?.en ?? cat?.name ?? 'CATEGORY';
  return {
    subtitle: String(base).toUpperCase(),
    icon:     u?.icon ?? '📌',
  };
}
 

function formatWon(n) {
  return Math.abs(Number(n) || 0).toLocaleString('ko-KR');
}
 

function formatTxAmount(amount, type) {
  const abs = formatWon(amount);
  if (type === 'INCOME') return `+ ${abs}원`;
  return `- ${abs}원`;
}

function formatDateParts(isoDate) {
  if (!isoDate) return { mmdd: '—', sub: '' };
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { mmdd: '—', sub: '' };
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const w  = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return { mmdd: `${mm}/${dd}`, sub: `${w}요일` };
}
 

function sortTxItems(items) {
  return [...items].sort((a, b) => {
    const db = new Date(b.transaction_date).getTime();
    const da = new Date(a.transaction_date).getTime();
    if (db !== da) return db - da;
    return (b.id ?? 0) - (a.id ?? 0); // 같은 날짜면 최신 ID 우선
  });
}

const userTransactions = computed(() => {
  const uid = activeUserId.value;
  if (uid == null) return [];
  return transactions.value.filter((t) => t.user_id === uid);
});
 

const categoryGroups = computed(() => {
  const byCat = new Map();
 
  for (const t of userTransactions.value) {
    const cid = t.category_id;
    if (!byCat.has(cid)) {
      const cat = catById.value.get(cid);
      const ui  = uiForCategory(cat, cid);
      byCat.set(cid, {
        categoryId:   cid,
        nameKo:       cat?.name ?? '알 수 없는 카테고리',
        subtitle:     ui.subtitle,
        icon:         ui.icon,
        items:        [],
        incomeTotal:  0,
        expenseTotal: 0,
      });
    }
    const g   = byCat.get(cid);
    const amt = Number(t.amount) || 0;
    g.items.push(t);
    if      (t.type === 'INCOME')  g.incomeTotal  += amt;
    else if (t.type === 'EXPENSE') g.expenseTotal += amt;
  }
 
  // 각 그룹 내 items 정렬
  for (const g of byCat.values()) g.items = sortTxItems(g.items);
 
  // 거래 합계 큰 카테고리 우선 정렬
  return [...byCat.values()].sort(
    (a, b) => (b.incomeTotal + b.expenseTotal) - (a.incomeTotal + a.expenseTotal),
  );
});
 

const monthGroups = computed(() => {
  const byMonth = new Map();
 
  for (const t of userTransactions.value) {
    const raw = t.transaction_date;
    if (!raw) continue;
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) continue;
 
    const y   = d.getFullYear();
    const m   = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
 
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        monthKey:     key,
        title:        `${y}년 ${m}월`,
        subtitle:     `MONTHLY · ${y}.${String(m).padStart(2, '0')}`,
        icon:         '📅',
        items:        [],
        incomeTotal:  0,
        expenseTotal: 0,
      });
    }
    const g   = byMonth.get(key);
    const amt = Number(t.amount) || 0;
    g.items.push(t);
    if      (t.type === 'INCOME')  g.incomeTotal  += amt;
    else if (t.type === 'EXPENSE') g.expenseTotal += amt;
  }
 
  const list = [...byMonth.values()];
  for (const g of list) g.items = sortTxItems(g.items);
  list.sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // 최신 월 우선
  return list;
});
 

const dayGroups = computed(() => {
  const byDay = new Map();
 
  for (const t of userTransactions.value) {
    const raw = t.transaction_date;
    if (!raw) continue;
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) continue;
 
    const y   = d.getFullYear();
    const m   = d.getMonth() + 1;
    const day = d.getDate();
    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
 
    if (!byDay.has(key)) {
      const title = d.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      });
      byDay.set(key, {
        dayKey:       key,
        title,
        subtitle:     `DAILY · ${key}`,
        icon:         '📆',
        items:        [],
        incomeTotal:  0,
        expenseTotal: 0,
      });
    }
    const g   = byDay.get(key);
    const amt = Number(t.amount) || 0;
    g.items.push(t);
    if      (t.type === 'INCOME')  g.incomeTotal  += amt;
    else if (t.type === 'EXPENSE') g.expenseTotal += amt;
  }
 
  const list = [...byDay.values()];
  for (const g of list) g.items = sortTxItems(g.items);
  list.sort((a, b) => b.dayKey.localeCompare(a.dayKey)); // 최신 날짜 우선
  return list;
});
 

const panelGroups = computed(() => {
  if (activeTab.value === 'category') {
    return categoryGroups.value.map((g) => ({
      key:          `c-${g.categoryId}`,
      title:        g.nameKo,
      subtitle:     g.subtitle,
      icon:         g.icon,
      incomeTotal:  g.incomeTotal,
      expenseTotal: g.expenseTotal,
      items:        g.items,
    }));
  }
  if (activeTab.value === 'month') {
    return monthGroups.value.map((g) => ({
      key:          `m-${g.monthKey}`,
      title:        g.title,
      subtitle:     g.subtitle,
      icon:         g.icon,
      incomeTotal:  g.incomeTotal,
      expenseTotal: g.expenseTotal,
      items:        g.items,
    }));
  }
 
  return dayGroups.value.map((g) => ({
    key:          `d-${g.dayKey}`,
    title:        g.title,
    subtitle:     g.subtitle,
    icon:         g.icon,
    incomeTotal:  g.incomeTotal,
    expenseTotal: g.expenseTotal,
    items:        g.items,
  }));
});
 

async function loadData() {
  loading.value      = true;
  error.value        = null;
  activeUserId.value = null;
  try {
    const [txRes, catRes, userRes] = await Promise.all([
      axios.get(`${API_BASE}/transactions`),
      axios.get(`${API_BASE}/categories`),
      axios.get(`${API_BASE}/users`),
    ]);
    transactions.value = Array.isArray(txRes.data)  ? txRes.data  : [];
    categories.value   = Array.isArray(catRes.data) ? catRes.data : [];
    const users        = Array.isArray(userRes.data) ? userRes.data : [];
    // 첫 번째 사용자를 기본 활성 사용자로 설정 (멀티 사용자 지원 미구현)
    activeUserId.value = users.length ? Number(users[0].id) : null;
  } catch {
    error.value = '데이터를 불러오지 못했습니다. npm run api 로 json-server(3000) 실행 후 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}
 

onMounted(() => {
  document.addEventListener('keydown', onDocKeydown);
  loadData();
});
</script>

<style scoped>

.list-screen {
  box-sizing: border-box;
  padding: 28px 20px 20px;
  min-height: 100%;
  font-family:
    'Pretendard',
    'Apple SD Gothic Neo',
    'Malgun Gothic',
    system-ui,
    sans-serif;
}

/* 패널: 둥근 모서리 + 내부 패딩 */
.list-panel {
  --kb-yellow: #ffbc00;
  --kb-yellow-soft: #ffcc00;
  --kb-gray: #60584c;
  --bg: #0a0a0a;
  --text: #ffffff;
  --muted: #888888;
  --icon-bg: #1a1a1a;
  --line: #2a2a2a;

  box-sizing: border-box;
  background: var(--bg);
  color: var(--text);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 10px 12px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.page-head {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.page-title {
  margin: -20px 0 20px;
  color: #e5e2e1;
  font-size: 1.5rem;
  font-weight: 600;
}

/* 탭 버튼 행 */
.list-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;
}

.list-tab {
  flex: 1 1 auto;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--icon-bg);
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  cursor: pointer;
  line-height: 1.25;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.list-tab:hover {
  color: var(--text);
  border-color: var(--kb-gray);
}

.list-tab--active {
  color: var(--text);
  border-color: var(--kb-yellow);
  box-shadow: 0 0 0 1px rgba(255, 188, 0, 0.35);
  background: rgba(255, 188, 0, 0.08);
}

/* 로딩·에러·빈 목록 메시지 */
.state-msg {
  text-align: center;
  padding: 48px 16px;
  color: var(--muted);
  font-size: 0.95rem;
}

.state-err {
  color: #ff9e9e;
}

/* 그룹(카테고리·월·일) 블록 간격 */
.ledger-block {
  margin-bottom: 36px;
}

.ledger-block:last-child {
  margin-bottom: 0;
}

/* 그룹 헤더: 아이콘 + 제목/부제 + 수입·지출 합계 */
.ledger-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

/* 그룹 아이콘 박스 */
.ledger-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
  border: 1px solid var(--line);
}

.ledger-labels {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ledger-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.ledger-sub {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--kb-gray);
  text-transform: uppercase;
}

/* 그룹 우측 합계: 수입(연한 옐로) / 지출(메인 옐로) */
.ledger-totals {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  text-align: right;
}

/* 합계 숫자 공통 */
.sum {
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;
}

.sum--income {
  color: var(--kb-yellow-soft);
}

.sum--expense {
  color: var(--kb-yellow);
}

/* 거래 목록 */
.tx-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 거래 한 줄: 수입·지출에 따라 뱃지 색만 구분 */
.tx-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 6px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  border-radius: 8px;
  margin: 0 -6px;
  transition: background 0.15s ease;
}

.tx-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tx-row:focus-visible {
  outline: 2px solid var(--kb-yellow);
  outline-offset: 2px;
}

.tx-row:last-child {
  border-bottom: none;
}

/* 상세 모달 (Teleport → body, 글로벌 톤) */
.tx-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.tx-modal {
  width: 90%;
  max-width: 500px;
  max-height: min(90vh, 640px);
  overflow: auto;
  box-sizing: border-box;
  background: #0a0a0a;
  color: #ffffff;
  border-radius: 16px;
  /* 모달 겉 테두리 색은 여기서 변경 (예: 1px solid #ffbc00) */
  border: 1px solid rgba(255, 188, 0, 0.35);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  font-family: inherit;
}

.tx-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #2a2a2a;
}

.tx-modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tx-modal-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #1a1a1a;
  color: #888888;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.tx-modal-close:hover {
  color: #ffbc00;
  background: rgba(255, 188, 0, 0.12);
}

.tx-modal-form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tx-modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tx-modal-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #60584c;
  text-transform: uppercase;
}

.tx-modal-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 0.9rem;
  font-family: inherit;
}

.tx-modal-input:focus {
  outline: none;
  border-color: #ffbc00;
  box-shadow: 0 0 0 1px rgba(255, 188, 0, 0.25);
}

/* Chrome/Edge/Safari: 날짜 필드 달력 아이콘을 KB 옐로(#ffbc00)에 가깝게 */
.tx-modal-input[type='date'] {
  color-scheme: var(--kb-yellow);
}

.tx-modal-input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 1;
  filter: invert(73%) sepia(96%) saturate(2000%) hue-rotate(359deg) brightness(103%) contrast(102%);
}

.tx-modal-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.4;
}

.tx-modal-err {
  margin: 0;
  font-size: 0.82rem;
  color: #ff9e9e;
}

.tx-modal-ok {
  margin: 0;
  font-size: 0.82rem;
  color: #ffbc00;
}

.tx-modal-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.tx-modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.tx-modal-btn {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid #2a2a2a;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.tx-modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tx-modal-btn--ghost {
  background: #1a1a1a;
  color: #888888;
}

.tx-modal-btn--ghost:hover:not(:disabled) {
  color: #ffffff;
  border-color: #60584c;
}

.tx-modal-btn--primary {
  background: rgba(255, 188, 0, 0.15);
  color: #ffffff;
  border-color: #ffbc00;
}

.tx-modal-btn--primary:hover:not(:disabled) {
  background: rgba(255, 188, 0, 0.22);
}

.tx-modal-btn--danger {
  background: rgba(255, 80, 80, 0.12);
  color: #ff9e9e;
  border-color: rgba(255, 100, 100, 0.35);
}

.tx-modal-btn--danger:hover:not(:disabled) {
  background: rgba(255, 80, 80, 0.2);
}

.tx-date {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 44px;
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.2;
}

/* 날짜 두 번째 줄(요일) */
.tx-subdate {
  font-size: 0.65rem;
  opacity: 0.85;
}

/* 메모·카테고리(조건부)·뱃지 */
.tx-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 수입/지출 뱃지 기본 */
.tx-badge {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--muted);
}

/* 수입 행 뱃지 */
.tx-row--income .tx-badge {
  color: var(--kb-yellow-soft);
  background: rgba(255, 204, 0, 0.12);
}

/* 지출 행 뱃지 */
.tx-row--expense .tx-badge {
  color: var(--kb-yellow);
  background: rgba(255, 188, 0, 0.1);
}

/* 거래 메모(제목) */
.tx-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
  word-break: break-word;
}

/* 월·일 탭에서 카테고리명 */
.tx-meta {
  font-size: 0.72rem;
  color: var(--kb-gray);
}

/* 행 우측 금액 */
.tx-amount {
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
}

.tx-amount--expense {
  color: var(--text);
}

.tx-amount--income {
  color: var(--text);
}

/* ===== 모바일: 좁은 화면 여백 + 하단 네비·FAB ===== */
@media (max-width: 767px) {
  .list-screen {
    padding: 20px 16px 100px;
  }

  .list-panel {
    padding: 16px 12px 20px;
    border-radius: 14px;
  }

  .list-tabs {
    flex-direction: column;
  }

  .list-tab {
    flex: none;
    width: 100%;
    text-align: center;
  }

  /* 그룹 헤더(아이콘/제목/합계) 모바일 세로 정렬 */
  .ledger-head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .ledger-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .ledger-totals {
    flex-direction: row;
    justify-content: flex-end;
    align-items: baseline;
    gap: 10px;
  }

  /* 거래 한 줄: 모바일에서는 2줄 그리드로 재배치 */
  .tx-row {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'date body'
      'amount amount';
    gap: 10px 12px;
    padding: 12px 8px;
    margin: 0 -8px;
  }

  .tx-date {
    grid-area: date;
    min-width: 0;
  }

  .tx-body {
    grid-area: body;
  }

  .tx-amount {
    grid-area: amount;
    justify-self: end;
    padding-top: 0;
  }
}
</style>

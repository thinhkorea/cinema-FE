<template>
  <div class="container text-center py-5">
    <h2 v-if="success" class="text-success">🎉 Thanh toán thành công!</h2>
    <h2 v-else class="text-danger">❌ Thanh toán thất bại!</h2>
    <p v-if="txnRef">Mã giao dịch: {{ txnRef }}</p>
    <router-link to="/" class="btn btn-primary mt-3">Về trang chủ</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()
const success = ref(false)
const txnRef = ref(null)

onMounted(async () => {
  const responseCode = route.query.vnp_ResponseCode?.toString()
  txnRef.value = route.query.vnp_TxnRef || localStorage.getItem('txnRef') // ✅ lấy lại nếu mất

  console.log('VNPay Response Code:', responseCode)
  console.log('VNPay TxnRef:', txnRef.value)

  if (responseCode === '00' && txnRef.value) {
    try {
      await api.post(`/bookings/pay-by-txn/${txnRef.value}`)
      success.value = true
      console.log('✅ Cập nhật thanh toán thành công!')
      localStorage.removeItem('txnRef') // dọn cache
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật thanh toán:', err)
    }
  } else {
    console.warn('❌ VNPay báo lỗi hoặc thiếu TxnRef:', responseCode)
  }
})

</script>
<!-- <template>
  <div class="container py-5 text-center">
    <h2 v-if="success" class="text-success">✅ Thanh toán thành công!</h2>
    <h2 v-else class="text-danger">❌ Thanh toán thất bại!</h2>

    <div class="mt-4">
      <router-link to="/" class="btn btn-primary">Về trang chủ</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()
const success = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/payments/vnpay-return', { params: route.query })
    console.log('VNPay return:', res.data)
    success.value = true
  } catch (err) {
    console.error(err)
    success.value = false
  }
})
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style> -->

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session'
import {
  RefreshCcw,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
} from 'lucide-vue-next'

const auth = useAuthStore()
const session = useSessionStore()
const router = useRouter()
const menuOpen = ref(false)

async function handleSignOut() {
  menuOpen.value = false
  session.reset()
  await auth.signOut()
  await router.replace('/login')
}
</script>

<template>
  <header class="w-full max-w-[620px] mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 text-white no-underline">
        <RefreshCcw class="w-5 h-5" :stroke-width="3" />
        <span class="text-xl font-bold tracking-tight">PomoQ</span>
      </router-link>

      <!-- Nav -->
      <div class="relative">
        <button
          @click="menuOpen = !menuOpen"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="auth.displayName"
            class="w-6 h-6 rounded-full"
          />
          <span class="hidden sm:inline">{{ auth.displayName }}</span>
          <ChevronDown class="w-4 h-4" :stroke-width="2" />
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg border border-gray-200 z-50"
            @click="menuOpen = false"
          >
            <router-link
              to="/dashboard"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
            >
              <LayoutDashboard class="w-4 h-4 text-gray-400" :stroke-width="1.8" />
              Dashboard
            </router-link>
            <router-link
              to="/report"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
            >
              <FileText class="w-4 h-4 text-gray-400" :stroke-width="1.8" />
              Relatório
            </router-link>
            <router-link
              to="/settings"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
            >
              <Settings class="w-4 h-4 text-gray-400" :stroke-width="1.8" />
              Configurações
            </router-link>
            <hr class="my-1 border-gray-200" />
            <button
              @click="handleSignOut"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <LogOut class="w-4 h-4 text-gray-400" :stroke-width="1.8" />
              Sair
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <!-- Click outside to close -->
  <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false" />
</template>

import { supabase } from "@/lib/supabase"

// ✅ УДАЛЯЕМ функцию deleteVisit, так как теперь используем прямое обращение к Supabase
// Все операции с визитами теперь идут через Supabase напрямую в компонентах

// Если нужны другие API функции, добавляем их здесь
export const api = {
  // Пример других API функций, если они понадобятся
  async healthCheck() {
    try {
      const { data, error } = await supabase.from("stores").select("id").limit(1)
      return { success: !error, data }
    } catch (error) {
      return { success: false, error }
    }
  },
}

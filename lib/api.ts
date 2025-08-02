export const deleteVisit = async (id: string) => {
  try {
    console.log("Отправляем DELETE запрос для ID:", id)

    const response = await fetch(`/api/visits/${id}`, {
      // БЕЗ завершающего слеша
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ошибка! статус: ${response.status}`)
    }

    const result = await response.json()
    console.log("Визит успешно удален:", result)
    return result
  } catch (error) {
    console.error("Ошибка при удалении визита:", error)
    throw error
  }
}

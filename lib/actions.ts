// lib/actions.ts

import { prisma } from "@/lib/db"

export async function deleteVisitFromDB(id: string) {
  try {
    await prisma.visit.delete({ where: { id } })
  } catch (error) {
    console.error("Error deleting visit in DB:", error)
    throw error
  }
}

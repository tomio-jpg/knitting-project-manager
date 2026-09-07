export type ProjectStatus = 'in-progress' | 'completed'

export type Project = {
  id: string
  title: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  targetRow: number | null
  targetStitch: number | null
  autoAdvanceAtTargetStitch: boolean
  currentRow: number
  currentStitch: number
  memo: string
  nextAction: string
}

export type ProjectPhoto = {
  id: string
  projectId: string
  blob: Blob
  fileName: string
  createdAt: string
}

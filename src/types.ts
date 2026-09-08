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
  completedAt?: string
  counterSettings?: CounterSettings
  timer?: TimerState
  lastTimerDurationSeconds?: number
  lastTimerSession?: {
    durationSeconds: number
    endedAt: string
  }
}

export type CounterSettings = {
  rowIncrease: number[]
  rowDecrease: number[]
  stitchIncrease: number[]
  stitchDecrease: number[]
}

export type TimerState = {
  state: 'running' | 'paused'
  startedAt: string
  resumedAt: string | null
  accumulatedSeconds: number
  hidden: boolean
}

export type CountHistory = {
  id: string
  projectId: string
  createdAt: string
  kind: 'count' | 'undo'
  label: string
  beforeRow: number
  beforeStitch: number
  afterRow: number
  afterStitch: number
  autoAdvanceRows?: number
}

export type CounterOperation = {
  id: string
  projectId: string
  createdAt: string
  beforeRow: number
  beforeStitch: number
  afterRow: number
  afterStitch: number
  undone: boolean
}

export type WorkLog = {
  id: string
  projectId: string
  startedAt: string
  endedAt: string
  durationSeconds: number
}

export type ProjectPhoto = {
  id: string
  projectId: string
  blob: Blob
  fileName: string
  createdAt: string
}

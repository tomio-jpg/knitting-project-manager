import Dexie, { type EntityTable } from 'dexie'
import type { CountHistory, CounterOperation, Project, ProjectPhoto, WorkLog } from './types'

const db = new Dexie('knitting-project-manager') as Dexie & {
  projects: EntityTable<Project, 'id'>
  projectPhotos: EntityTable<ProjectPhoto, 'id'>
  countHistory: EntityTable<CountHistory, 'id'>
  counterOperations: EntityTable<CounterOperation, 'id'>
  workLogs: EntityTable<WorkLog, 'id'>
}

db.version(1).stores({
  projects: 'id, status, createdAt, updatedAt',
  projectPhotos: 'id, projectId, createdAt',
})

db.version(2).stores({
  projects: 'id, status, createdAt, updatedAt',
  projectPhotos: 'id, projectId, createdAt',
  countHistory: 'id, projectId, createdAt',
  counterOperations: 'id, projectId, createdAt, undone',
  workLogs: 'id, projectId, startedAt, endedAt',
}).upgrade(async (transaction) => {
  await transaction.table('projects').toCollection().modify((project: Project) => {
    if (project.currentRow === 0) project.currentRow = 1
  })
})

db.version(3).stores({
  projects: 'id, status, createdAt, updatedAt',
  projectPhotos: 'id, projectId, createdAt, [projectId+sortOrder]',
  countHistory: 'id, projectId, createdAt',
  counterOperations: 'id, projectId, createdAt, undone',
  workLogs: 'id, projectId, startedAt, endedAt',
}).upgrade(async (transaction) => {
  const photos = await transaction.table('projectPhotos').toArray() as ProjectPhoto[]
  const grouped = new Map<string, ProjectPhoto[]>()
  photos.forEach((photo) => grouped.set(photo.projectId, [...(grouped.get(photo.projectId) ?? []), photo]))
  await Promise.all([...grouped.values()].map(async (projectPhotos) => {
    const ordered = [...projectPhotos].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    await Promise.all(ordered.map((photo, index) => transaction.table('projectPhotos').update(photo.id, {
      sortOrder: index,
      isMain: index === 0,
      memo: photo.memo ?? '',
    })))
  }))
})

export { db }

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

export { db }

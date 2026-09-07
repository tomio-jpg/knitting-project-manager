import Dexie, { type EntityTable } from 'dexie'
import type { Project, ProjectPhoto } from './types'

const db = new Dexie('knitting-project-manager') as Dexie & {
  projects: EntityTable<Project, 'id'>
  projectPhotos: EntityTable<ProjectPhoto, 'id'>
}

db.version(1).stores({
  projects: 'id, status, createdAt, updatedAt',
  projectPhotos: 'id, projectId, createdAt',
})

export { db }

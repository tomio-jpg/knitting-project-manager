import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { db } from './db'
import type { Project, ProjectPhoto } from './types'
import './App.css'

type Screen = 'home' | 'projects' | 'new-project' | 'project'

type DraftProject = {
  title: string
  targetRow: string
  targetStitch: string
  autoAdvanceAtTargetStitch: boolean
  memo: string
  nextAction: string
  registerInProgress: boolean
  currentRow: string
  currentStitch: string
}

const emptyDraft = (): DraftProject => ({
  title: '',
  targetRow: '',
  targetStitch: '',
  autoAdvanceAtTargetStitch: false,
  memo: '',
  nextAction: '',
  registerInProgress: false,
  currentRow: '0',
  currentStitch: '0',
})

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<ProjectPhoto[]>([])
  const [draft, setDraft] = useState<DraftProject>(emptyDraft)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const previewUrls = useMemo(
    () => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles],
  )
  const savedPhotoUrls = useMemo(
    () => photos.map((photo) => ({ photo, url: URL.createObjectURL(photo.blob) })),
    [photos],
  )

  useEffect(() => {
    return () => {
      previewUrls.forEach(({ url }) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  useEffect(() => {
    return () => {
      savedPhotoUrls.forEach(({ url }) => URL.revokeObjectURL(url))
    }
  }, [savedPhotoUrls])

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    void db.projectPhotos.where('projectId').equals(selectedProjectId).sortBy('createdAt').then(setPhotos)
  }, [selectedProjectId])

  async function loadProjects() {
    const savedProjects = await db.projects.orderBy('updatedAt').reverse().toArray()
    setProjects(savedProjects)
  }

  function updateDraft<Key extends keyof DraftProject>(key: Key, value: DraftProject[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    setSelectedFiles((current) => [...current, ...files])
    event.target.value = ''
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function openNewProject() {
    setDraft(emptyDraft())
    setSelectedFiles([])
    setNotice('')
    setScreen('new-project')
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) {
      setNotice('作品名を入力してください。')
      return
    }

    setIsSaving(true)
    setNotice('')
    const now = new Date().toISOString()
    const project: Project = {
      id: crypto.randomUUID(),
      title,
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
      targetRow: parseOptionalNumber(draft.targetRow),
      targetStitch: parseOptionalNumber(draft.targetStitch),
      autoAdvanceAtTargetStitch: Boolean(draft.targetStitch) && draft.autoAdvanceAtTargetStitch,
      memo: draft.memo.trim(),
      nextAction: draft.nextAction.trim(),
      currentRow: draft.registerInProgress ? parseCount(draft.currentRow) : 0,
      currentStitch: draft.registerInProgress ? parseCount(draft.currentStitch) : 0,
    }

    try {
      await db.transaction('rw', db.projects, db.projectPhotos, async () => {
        await db.projects.add(project)
        await db.projectPhotos.bulkAdd(
          selectedFiles.map((file) => ({
            id: crypto.randomUUID(),
            projectId: project.id,
            blob: file,
            fileName: file.name,
            createdAt: now,
          })),
        )
      })
      await loadProjects()
      setSelectedProjectId(project.id)
      setSelectedFiles([])
      setScreen('project')
    } catch {
      setNotice('保存できませんでした。iPhoneの空き容量を確認して、もう一度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  function openProject(projectId: string) {
    setSelectedProjectId(projectId)
    setScreen('project')
  }

  const inProgressProjects = projects.filter((project) => project.status === 'in-progress')

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <HomeScreen
          projects={inProgressProjects}
          onAddProject={openNewProject}
          onOpenProjects={() => setScreen('projects')}
          onOpenProject={openProject}
        />
      )}
      {screen === 'projects' && (
        <ProjectsScreen projects={inProgressProjects} onBack={() => setScreen('home')} onAddProject={openNewProject} onOpenProject={openProject} />
      )}
      {screen === 'new-project' && (
        <NewProjectScreen
          draft={draft}
          files={previewUrls}
          isSaving={isSaving}
          notice={notice}
          onCancel={() => setScreen(projects.length ? 'projects' : 'home')}
          onSubmit={saveProject}
          onUpdate={updateDraft}
          onSelectPhotos={selectPhotos}
          onRemovePhoto={removeSelectedFile}
        />
      )}
      {screen === 'project' && selectedProject && (
        <ProjectScreen project={selectedProject} photos={savedPhotoUrls} onBack={() => setScreen('projects')} />
      )}
    </div>
  )
}

function HomeScreen({ projects, onAddProject, onOpenProjects, onOpenProject }: { projects: Project[]; onAddProject: () => void; onOpenProjects: () => void; onOpenProject: (id: string) => void }) {
  return <main className="page home-page">
    <header className="home-header"><p>個人用 編み物制作管理</p><h1>編みもの記録</h1></header>
    <button className="primary-button" type="button" onClick={onAddProject}>＋ 新しい作品を登録</button>
    <section className="section"><div className="section-heading"><h2>制作中</h2><button className="text-button" type="button" onClick={onOpenProjects}>すべて見る</button></div>
      {projects.length === 0 ? <div className="empty-card"><span>🧶</span><p>まだ作品がありません</p><small>「新しい作品を登録」から始めましょう。</small></div> : <div className="project-list">{projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />)}</div>}
    </section>
  </main>
}

function ProjectsScreen({ projects, onBack, onAddProject, onOpenProject }: { projects: Project[]; onBack: () => void; onAddProject: () => void; onOpenProject: (id: string) => void }) {
  return <main className="page"><Header title="制作中の作品" onBack={onBack} /><button className="primary-button" type="button" onClick={onAddProject}>＋ 新しい作品を登録</button><section className="section">{projects.length === 0 ? <div className="empty-card"><span>🧶</span><p>まだ作品がありません</p></div> : <div className="project-list">{projects.map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />)}</div>}</section></main>
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  return <button className="project-card" type="button" onClick={() => onOpen(project.id)}><span className="project-card-icon">🧶</span><span className="project-card-body"><strong>{project.title}</strong><small>{project.nextAction ? `次にやること：${project.nextAction}` : '制作を始める準備ができました'}</small></span><span aria-hidden="true">›</span></button>
}

function NewProjectScreen({ draft, files, isSaving, notice, onCancel, onSubmit, onUpdate, onSelectPhotos, onRemovePhoto }: { draft: DraftProject; files: { file: File; url: string }[]; isSaving: boolean; notice: string; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onUpdate: <Key extends keyof DraftProject>(key: Key, value: DraftProject[Key]) => void; onSelectPhotos: (event: ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: (index: number) => void }) {
  return <main className="page form-page"><Header title="新しい作品" onBack={onCancel} backLabel="キャンセル" /><form onSubmit={onSubmit}>
    <section className="form-section"><label className="field-label" htmlFor="title">作品名 <span>必須</span></label><input id="title" value={draft.title} onChange={(event) => onUpdate('title', event.target.value)} placeholder="例：春色のショール" autoFocus /></section>
    <section className="form-section"><p className="field-label">作品写真 <span>任意・複数可</span></p><div className="photo-grid">{files.map(({ file, url }, index) => <div className="photo-preview" key={`${file.name}-${index}`}><img src={url} alt="追加する作品写真" /><button type="button" aria-label={`${file.name}を取り除く`} onClick={() => onRemovePhoto(index)}>×</button></div>)}<label className="add-photo"><input type="file" accept="image/*" multiple onChange={onSelectPhotos} />＋<small>写真を追加</small></label></div></section>
    <section className="form-section"><div className="two-fields"><NumberField label="目標段数" value={draft.targetRow} onChange={(value) => onUpdate('targetRow', value)} suffix="段" /><NumberField label="目標目数" value={draft.targetStitch} onChange={(value) => onUpdate('targetStitch', value)} suffix="目" /></div><label className={`switch-row${draft.targetStitch ? '' : ' is-disabled'}`}><span><strong>目標目数で自動段送り</strong><small>目標目数に達すると、自動で次の段へ進みます</small></span><input type="checkbox" checked={draft.autoAdvanceAtTargetStitch} disabled={!draft.targetStitch} onChange={(event) => onUpdate('autoAdvanceAtTargetStitch', event.target.checked)} /><i aria-hidden="true" /></label></section>
    <section className="form-section compact"><button type="button" className="disclosure" onClick={() => onUpdate('registerInProgress', !draft.registerInProgress)}><span>{draft.registerInProgress ? '⌄' : '›'}</span> 途中から登録する</button>{draft.registerInProgress && <div className="two-fields disclosure-content"><NumberField label="開始段数" value={draft.currentRow} onChange={(value) => onUpdate('currentRow', value)} suffix="段" /><NumberField label="現在の目数" value={draft.currentStitch} onChange={(value) => onUpdate('currentStitch', value)} suffix="目" /></div>}</section>
    <section className="form-section"><label className="field-label" htmlFor="memo">メモ <span>任意</span></label><textarea id="memo" value={draft.memo} onChange={(event) => onUpdate('memo', event.target.value)} placeholder="糸や編み方などを記録できます" rows={4} /></section>
    <section className="form-section"><label className="field-label" htmlFor="next-action">次にやること <span>任意</span></label><input id="next-action" value={draft.nextAction} onChange={(event) => onUpdate('nextAction', event.target.value)} placeholder="例：3段目を編む" /></section>
    {notice && <p className="notice" role="alert">{notice}</p>}<button className="primary-button create-button" disabled={isSaving} type="submit">{isSaving ? '保存中…' : 'この作品を作成'}</button>
  </form></main>
}

function ProjectScreen({ project, photos, onBack }: { project: Project; photos: { photo: ProjectPhoto; url: string }[]; onBack: () => void }) {
  return <main className="page"><Header title="作品" onBack={onBack} /><section className="project-summary"><div className="summary-icon">🧶</div><h1>{project.title}</h1>{photos.length > 0 && <div className="saved-photos">{photos.map(({ photo, url }) => <img key={photo.id} src={url} alt={`${project.title}の作品写真`} />)}</div>}<dl><div><dt>現在</dt><dd>{project.currentRow}段・{project.currentStitch}目</dd></div>{project.targetRow !== null && <div><dt>目標段数</dt><dd>{project.targetRow}段</dd></div>}{project.targetStitch !== null && <div><dt>目標目数</dt><dd>{project.targetStitch}目{project.autoAdvanceAtTargetStitch ? '（自動段送りON）' : ''}</dd></div>}{project.nextAction && <div><dt>次にやること</dt><dd>{project.nextAction}</dd></div>}{project.memo && <div><dt>メモ</dt><dd>{project.memo}</dd></div>}</dl><p className="coming-soon">カウンターなどの制作機能は次の段階で追加します。</p></section></main>
}

function Header({ title, onBack, backLabel = '＜ 戻る' }: { title: string; onBack: () => void; backLabel?: string }) { return <header className="page-header"><button type="button" className="back-button" onClick={onBack}>{backLabel}</button><h1>{title}</h1><span aria-hidden="true" /></header> }

function NumberField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) { return <label className="number-field"><span>{label}<small>任意</small></span><span className="number-input"><input type="number" min="0" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} /><em>{suffix}</em></span></label> }

function parseOptionalNumber(value: string) { return value === '' ? null : parseCount(value) }
function parseCount(value: string) { return Math.max(0, Number.parseInt(value, 10) || 0) }

export default App

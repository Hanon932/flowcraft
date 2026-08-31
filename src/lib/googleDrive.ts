import type { FlowDoc, ReflectionEntry } from '../types'

const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const TOKEN_LIFETIME_MS = 55 * 60 * 1000

export interface DriveFileSummary {
  id: string
  name: string
  modifiedTime: string
}

let tokenClient: GoogleTokenClient | null = null
let cachedToken: { value: string; expiresAt: number } | null = null
let pending: { resolve: (token: string) => void; reject: (err: Error) => void } | null = null

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!id) {
    throw new Error(
      'Google Client IDが未設定です。.env.local に VITE_GOOGLE_CLIENT_ID を設定してください（README参照）。',
    )
  }
  return id
}

function waitForGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const start = Date.now()
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer)
        resolve()
      } else if (Date.now() - start > 10000) {
        clearInterval(timer)
        reject(new Error('Google Identity Services の読み込みに失敗しました。通信環境を確認してください。'))
      }
    }, 100)
  })
}

function getTokenClient(clientId: string): GoogleTokenClient {
  if (!tokenClient) {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (!pending) return
        if (response.error) {
          pending.reject(new Error(response.error_description || response.error))
        } else {
          cachedToken = { value: response.access_token, expiresAt: Date.now() + TOKEN_LIFETIME_MS }
          pending.resolve(response.access_token)
        }
        pending = null
      },
    })
  }
  return tokenClient
}

export async function requestAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  await waitForGis()
  const client = getTokenClient(getClientId())

  return new Promise((resolve, reject) => {
    pending = { resolve, reject }
    client.requestAccessToken({ prompt: '' })
  })
}

async function driveFetch(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Drive APIエラー (${res.status}): ${text}`)
  }
  return res
}

async function uploadJson(name: string, data: unknown, existingFileId?: string): Promise<string> {
  const token = await requestAccessToken()
  const metadata = { name, mimeType: 'application/json' }
  const boundary = 'flowcraft-boundary-' + Date.now()
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`

  const isUpdate = Boolean(existingFileId)
  const url = isUpdate
    ? `${UPLOAD_URL}/${existingFileId}?uploadType=multipart`
    : `${UPLOAD_URL}?uploadType=multipart`

  const res = await driveFetch(url, token, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const json = (await res.json()) as { id: string }
  return json.id
}

export async function saveDocToDrive(doc: FlowDoc): Promise<string> {
  const { driveFileId, ...docWithoutDriveId } = doc
  return uploadJson(`${doc.name}.flowcraft.json`, docWithoutDriveId, driveFileId)
}

export async function listDriveFiles(): Promise<DriveFileSummary[]> {
  const token = await requestAccessToken()
  const params = new URLSearchParams({
    q: "mimeType='application/json' and trashed=false",
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
    spaces: 'drive',
    pageSize: '50',
  })
  const res = await driveFetch(`${DRIVE_FILES_URL}?${params.toString()}`, token)
  const json = (await res.json()) as { files: DriveFileSummary[] }
  return json.files
}

export async function loadDriveFile(fileId: string): Promise<FlowDoc> {
  const token = await requestAccessToken()
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token)
  return (await res.json()) as FlowDoc
}

const REFLECTIONS_FILE_NAME = 'flowcraft-reflections.json'

export async function saveReflectionsToDrive(
  entries: ReflectionEntry[],
  existingFileId?: string,
): Promise<string> {
  return uploadJson(REFLECTIONS_FILE_NAME, entries, existingFileId)
}

export async function findReflectionsFile(): Promise<DriveFileSummary | null> {
  const token = await requestAccessToken()
  const params = new URLSearchParams({
    q: `name='${REFLECTIONS_FILE_NAME}' and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive',
    pageSize: '1',
  })
  const res = await driveFetch(`${DRIVE_FILES_URL}?${params.toString()}`, token)
  const json = (await res.json()) as { files: DriveFileSummary[] }
  return json.files[0] ?? null
}

export async function loadReflectionsFromDrive(fileId: string): Promise<ReflectionEntry[]> {
  const token = await requestAccessToken()
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token)
  return (await res.json()) as ReflectionEntry[]
}

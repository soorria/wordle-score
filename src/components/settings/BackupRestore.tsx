import { Component, createEffect, For, JSXElement, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useScoreContext } from '~/lib/score-context'
import { ScoreRecord } from '~/types'
import { scrollToHash } from '~/utils/misc'
import Button from '../Button'

const Comparison: Component<{
  left: ScoreRecord
  leftTitle: JSXElement
  right: ScoreRecord
  rightTitle: JSXElement
}> = props => {
  const data = (record: ScoreRecord) => {
    return (
      <For each={Object.entries(record)} fallback={<p class="text-center">No data</p>}>
        {([day, score]) => (
          <p>
            Day {day} - <span class="font-mono">{score}</span>
          </p>
        )}
      </For>
    )
  }

  const side = (title: JSXElement, record: ScoreRecord) => (
    <div class="space-y-2 rounded border-2 border-gray-400 p-2 text-sm">
      <p class="text-center capitalize">{title}</p>
      <div class="space-y-1">{data(record)}</div>
    </div>
  )

  return (
    <div class="grid grid-cols-2 gap-2">
      {side(props.leftTitle, props.left)}
      {side(props.rightTitle, props.right)}
    </div>
  )
}

const IDS = { comparison: 'comparison' }

type RestoreStatus = 'idle' | 'comparing' | 'success' | 'failed'
const BackupRestore: Component = () => {
  const [
    { canRestore, allScores, syncDetails, record },
    { getJsonBackup, importJsonBackup, isBackupValid },
  ] = useScoreContext()

  const [state, setState] = createStore({
    status: 'idle' as RestoreStatus,
    backup: null as ScoreRecord | null,
    message: '',
    source: '',
  })
  let fileInputRef: HTMLInputElement | undefined = undefined

  createEffect(() => {
    if (state.status === 'comparing') scrollToHash(IDS.comparison)
  })

  const toClipboard = async () => {
    const backup = getJsonBackup()
    await navigator.clipboard.writeText(backup)
  }

  const toFile = async () => {
    const backup = getJsonBackup()
    const blob = new Blob([backup])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'wordle-score-backup.json'
    a.rel = 'noopener'
    a.dispatchEvent(new MouseEvent('click'))
  }

  const parseAndSet = (text: string, source: string) => {
    const parsed = JSON.parse(text)
    if (!isBackupValid(parsed)) throw new Error('invalid backup')
    setState({
      backup: parsed,
      source,
      status: 'comparing',
    })
  }

  const fromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      parseAndSet(text, 'clipboard')
    } catch {
      setState({
        status: 'failed',
        message: 'Invalid backup in clipboard',
        backup: null,
        source: 'clipboard',
      })
    }
  }

  const fromFile = async (file: File) => {
    try {
      const text = await file.text()
      parseAndSet(text, 'file')
    } catch {
      setState({
        status: 'failed',
        message: 'Invalid backup file',
        backup: null,
        source: 'file',
      })
    }
  }

  const fromServerData = async () => {
    const all = allScores()
    if (!all) return
    const serverDataForUser = all[syncDetails().user].record
    if (!serverDataForUser || !isBackupValid(serverDataForUser)) {
      setState({
        status: 'failed',
        message: 'No server data saved',
        backup: null,
        source: 'server',
      })
      return
    }

    setState({
      status: 'comparing',
      backup: serverDataForUser,
      source: 'server',
    })
  }

  const confirm = () => {
    importJsonBackup(state.backup)
    setState({
      status: 'success',
      backup: null,
      source: '',
      message: '',
    })
  }

  const Reset: Component = () => (
    <Button
      block
      onClick={() => {
        setState({
          backup: null,
          status: 'idle',
        })
      }}
    >
      Reset
    </Button>
  )

  return (
    <div class="space-y-4">
      <p>Backup &amp; Restore</p>
      <Show when={state.status === 'idle'}>
        <div class="space-y-2 text-sm">
          <p>Backup</p>
          <div class="grid grid-cols-2 gap-2">
            <Button onClick={toClipboard} block>
              To Clipboard
            </Button>
            <Button onClick={toFile} block>
              Download
            </Button>
          </div>
        </div>
        <div class="space-y-2 text-sm">
          <p>Restore</p>
          <div class="grid grid-cols-2 gap-2">
            <Button onClick={fromClipboard} block>
              From Clipboard
            </Button>
            <Button as="label" tabIndex={0}>
              From File
              <input
                ref={fileInputRef}
                type="file"
                class="sr-only"
                accept=".json"
                id="restore-file"
                tabIndex={-1}
                onInput={async event => {
                  const file = event.currentTarget?.files?.[0]
                  if (file) {
                    fromFile(file)
                  }
                }}
              />
            </Button>
            <Show when={canRestore()}>
              <Button class="col-span-full" type="button" block onClick={fromServerData}>
                From Server
              </Button>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={state.status === 'failed'}>
        <p class="text-sm">
          Failed to restore backup from <span class="capitalize">{state.source}</span>
        </p>
        <p class="text-sm">{state.message}</p>
        <Reset />
      </Show>

      <Show when={state.status === 'success'}>
        <p>Restored backup!</p>
        <Reset />
      </Show>

      <Show when={state.status === 'comparing'}>
        <div id={IDS.comparison} class="space-y-2 text-sm">
          <p>Compare and Confirm</p>

          <Comparison
            leftTitle={'Current Data'}
            left={record()}
            rightTitle={state.source}
            right={state.backup!}
          />

          <Button block onClick={confirm}>
            Confirm
          </Button>
          <Reset />
        </div>
      </Show>
    </div>
  )
}

export default BackupRestore
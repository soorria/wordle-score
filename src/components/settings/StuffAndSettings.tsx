import { dequal } from 'dequal'
import { Component, JSXElement, mergeProps, Show } from 'solid-js'
import { useScoreContext } from '~/lib/score-context'
import { useSettings } from '~/lib/settings'
import { toggle } from '~/utils/misc'
import Button from '~/components/Button'
import Collapse from '~/components/Collapse'
import BackupRestore from './BackupRestore'
import ForceSync from './ForceSync'

export const StuffAndSettings: Component = () => {
  const [{ syncDetails }, { setSyncDetails }] = useScoreContext()
  const [settings, setSettings] = useSettings()

  return (
    <Collapse summary="Stuff and Settings">
      <SettingsToggle
        label="Theme"
        onToggle={() => setSettings('theme', t => (t === 'dark' ? 'light' : 'dark'))}
        value={settings.theme === 'dark'}
        onChild="Dark"
        offChild="Light"
      />

      <SettingsToggle
        label="Animated Numbers"
        value={settings.animatedCounts}
        onToggle={() => setSettings('animatedCounts', toggle)}
        onChild="On"
        offChild="Off"
      />

      <SettingsToggle
        label="Shorten Big Numbers"
        value={settings.shortenBigNumbers}
        onToggle={() => setSettings('shortenBigNumbers', toggle)}
      />

      <SettingsToggle
        label="Coloured Scores"
        value={settings.colorScores}
        onToggle={() => setSettings('colorScores', toggle)}
      />

      <SettingsToggle
        label="Glowy Numbers"
        value={settings.glowyNumbers}
        onToggle={() => setSettings('glowyNumbers', toggle)}
      />

      <SettingsToggle
        label="Show Done Today Checkmark"
        value={settings.showDoneCheckmark}
        onToggle={() => setSettings('showDoneCheckmark', toggle)}
      />

      <SettingsToggle
        label="Sync Indicators"
        value={settings.showSyncIndicators}
        onToggle={() => setSettings('showSyncIndicators', toggle)}
      />

      <div class="space-y-4">
        <SettingsToggle
          label="Dev Stuff"
          value={settings.devStuff}
          onToggle={() => setSettings('devStuff', toggle)}
          onChild="Disable"
          offChild="Enable"
        />
        <Show when={settings.devStuff}>
          <p class="text-sm">Some stuff might be broken so be careful!</p>
        </Show>
      </div>

      <hr class="border-gray-300 dark:border-gray-600" />

      <form
        class="space-y-4"
        onSubmit={event => {
          event.preventDefault()
          const data = Object.fromEntries(new FormData(event.currentTarget))
          setSyncDetails(current => {
            if (
              dequal(data, current) ||
              typeof data.password !== 'string' ||
              typeof data.user !== 'string'
            ) {
              return current
            }

            return { password: data.password, user: data.user }
          })
        }}
      >
        <p>Sync Details</p>
        <div class="flex flex-col space-y-2">
          <label class="text-sm" for="sync-user">
            Username
          </label>
          <input
            type="text"
            class="form-input"
            name="user"
            id="sync-user"
            // @ts-expect-error
            attr:value={syncDetails().user}
          />
        </div>
        <div class="flex flex-col space-y-2">
          <label class="text-sm" for="sync-password">
            Password
          </label>
          <input type="password" class="form-input" name="password" id="sync-password" />
        </div>
        <Button type="submit" block>
          Save Sync Details
        </Button>
      </form>

      <BackupRestore />

      <hr class="border-gray-300 dark:border-gray-600" />

      <ForceSync />
    </Collapse>
  )
}

export const SettingsToggle: Component<{
  value: boolean
  onToggle: () => void
  label: string
  onChild?: JSXElement
  offChild?: JSXElement
  disabled?: boolean
}> = _props => {
  const props = mergeProps({ onChild: 'On', offChild: 'Off' }, _props)
  return (
    <div class="flex items-center justify-between">
      <p>{props.label}</p>
      <Button onClick={() => !props.disabled && props.onToggle()} disabled={props.disabled}>
        <Show when={props.value} fallback={props.offChild}>
          {props.onChild}
        </Show>
      </Button>
    </div>
  )
}

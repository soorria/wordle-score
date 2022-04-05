import * as types from 'pheno'
import { createContext, Component, useContext, createEffect } from 'solid-js'
import { SetStoreFunction, Store } from 'solid-js/store'
import { useLocalStorageStore } from '~/utils/use-local-storage'
import { Theme, updateThemeInDocument } from './theme'

export type Settings = {
  animatedCounts: boolean
  showSyncIndicators: boolean
  devStuff: boolean
  theme: Theme
}

const SettingsContext =
  createContext<[Store<Settings>, SetStoreFunction<Settings>]>()

export const SettingsProvider: Component = props => {
  const [settings, setSettings] = useLocalStorageStore<Settings>(
    'mooth:wordle-score-settings',
    {
      animatedCounts: true,
      showSyncIndicators: true,
      devStuff: false,
      theme: 'dark',
    },
    types.record(types.string, types.any) as types.TypeValidator<Settings>
  )

  createEffect(() => {
    updateThemeInDocument(settings.theme)
  })

  return (
    <SettingsContext.Provider value={[settings, setSettings]}>
      {props.children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)

  if (!ctx) {
    throw new Error('useSettings must be used inside <SettingsProvider>')
  }

  return ctx
}
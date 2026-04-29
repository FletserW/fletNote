import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type DesignMode = 'dark' | 'light' | 'assisted'

type DesignOption = {
  id: DesignMode
  label: string
  description: string
}

type DesignContextValue = {
  designMode: DesignMode
  setDesignMode: (mode: DesignMode) => void
  options: DesignOption[]
}

const DESIGN_STORAGE_KEY = '@fletnote/design-mode'

const DESIGN_OPTIONS: DesignOption[] = [
  {
    id: 'dark',
    label: 'Escuro',
    description: 'Visual atual com fundo escuro'
  },
  {
    id: 'light',
    label: 'Claro',
    description: 'Cores claras para uso diário'
  },
  {
    id: 'assisted',
    label: 'Fácil',
    description: 'Base para o modo guiado'
  }
]

const DesignContext = createContext<DesignContextValue | null>(null)

const isDesignMode = (value: string | null): value is DesignMode => {
  return value === 'dark' || value === 'light' || value === 'assisted'
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [designMode, setDesignModeState] = useState<DesignMode>(() => {
    if (typeof localStorage === 'undefined') return 'dark'

    const savedMode = localStorage.getItem(DESIGN_STORAGE_KEY)
    return isDesignMode(savedMode) ? savedMode : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.design = designMode
    localStorage.setItem(DESIGN_STORAGE_KEY, designMode)
  }, [designMode])

  const value = useMemo(
    () => ({
      designMode,
      setDesignMode: setDesignModeState,
      options: DESIGN_OPTIONS
    }),
    [designMode]
  )

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
}

export function useDesign() {
  const context = useContext(DesignContext)

  if (!context) {
    throw new Error('useDesign must be used inside DesignProvider')
  }

  return context
}

import { Moon, Palette, Sun } from 'lucide-react'
import { useDesign, type DesignMode } from '../contexts/DesignContext'

const Icons: Record<DesignMode, typeof Moon> = {
  dark: Moon,
  light: Sun,
  assisted: Palette
}

export default function DesignSwitcher() {
  const { designMode, setDesignMode, options } = useDesign()

  return (
    <div className="design-switcher" aria-label="Selecionar design">
      {options.map((option) => {
        const Icon = Icons[option.id]
        const isActive = designMode === option.id

        return (
          <button
            key={option.id}
            type="button"
            className={`design-switcher__button${isActive ? ' design-switcher__button--active' : ''}`}
            onClick={() => setDesignMode(option.id)}
            title={option.description}
            aria-pressed={isActive}
          >
            <Icon size={16} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

import { useRef, type PointerEvent } from 'react'
import { KEYPAD_ACTIONS, KEYPAD_RIBBON } from '../editor/keypad.ts'
import type { KeypadKey } from '../editor/keypad.ts'
import { isTapPointer } from '../editor/pointer.ts'
import type { HistoryOp } from '../editor/types.ts'

type PythonKeypadProps = {
  onOp: (op: HistoryOp) => void
  canUndo: boolean
  canRedo: boolean
}

type PointerTrack = {
  id: number
  x: number
  y: number
  scroll: number
  panning: boolean
}

function isKeyDisabled(keyDef: KeypadKey, canUndo: boolean, canRedo: boolean): boolean {
  if (keyDef.op.kind === 'undo') {
    return !canUndo
  }
  if (keyDef.op.kind === 'redo') {
    return !canRedo
  }
  return false
}

function KeypadButton({
  keyDef,
  disabled,
  onOp,
  getRibbonScroll,
  setRibbonScroll,
  variant,
}: {
  keyDef: KeypadKey
  disabled: boolean
  onOp: (op: HistoryOp) => void
  getRibbonScroll?: () => number
  setRibbonScroll?: (scrollLeft: number) => void
  variant: 'action' | 'ribbon'
}) {
  const trackRef = useRef<PointerTrack | null>(null)
  const skipClickRef = useRef(false)

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || event.button !== 0) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    skipClickRef.current = true
    trackRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scroll: getRibbonScroll?.() ?? 0,
      panning: false,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const track = trackRef.current
    if (!track || track.id !== event.pointerId) {
      return
    }
    if (isTapPointer(track.x, track.y, event.clientX, event.clientY)) {
      return
    }
    trackRef.current = { ...track, panning: true }
    setRibbonScroll?.(track.scroll - (event.clientX - track.x))
  }

  function finishPointer(event: PointerEvent<HTMLButtonElement>, apply: boolean) {
    const track = trackRef.current
    if (!track || track.id !== event.pointerId) {
      return
    }
    trackRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (apply && !track.panning && !disabled) {
      onOp(keyDef.op)
    }
    window.setTimeout(() => {
      skipClickRef.current = false
    }, 0)
  }

  return (
    <button
      type="button"
      className={`keypad-key keypad-key-${variant}`}
      aria-label={keyDef.ariaLabel}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointer(event, true)}
      onPointerCancel={(event) => finishPointer(event, false)}
      onClick={(event) => {
        if (skipClickRef.current) {
          event.preventDefault()
          skipClickRef.current = false
          return
        }
        if (disabled) {
          return
        }
        onOp(keyDef.op)
      }}
    >
      {keyDef.label}
    </button>
  )
}

export function PythonKeypad({ onOp, canUndo, canRedo }: PythonKeypadProps) {
  const ribbonRef = useRef<HTMLDivElement>(null)

  function getRibbonScroll() {
    return ribbonRef.current?.scrollLeft ?? 0
  }

  function setRibbonScroll(scrollLeft: number) {
    const ribbon = ribbonRef.current
    if (ribbon) {
      ribbon.scrollLeft = scrollLeft
    }
  }

  return (
    <div className="keypad" role="toolbar" aria-label="Панель Python-клавиш">
      <div className="keypad-actions">
        {KEYPAD_ACTIONS.map((keyDef) => (
          <KeypadButton
            key={keyDef.id}
            keyDef={keyDef}
            variant="action"
            disabled={isKeyDisabled(keyDef, canUndo, canRedo)}
            onOp={onOp}
          />
        ))}
      </div>
      <div className="keypad-ribbon-wrap">
        <div className="keypad-ribbon" ref={ribbonRef}>
          {KEYPAD_RIBBON.map((keyDef) => (
            <KeypadButton
              key={keyDef.id}
              keyDef={keyDef}
              variant="ribbon"
              getRibbonScroll={getRibbonScroll}
              setRibbonScroll={setRibbonScroll}
              disabled={isKeyDisabled(keyDef, canUndo, canRedo)}
              onOp={onOp}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

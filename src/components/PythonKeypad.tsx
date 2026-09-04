import { useRef, type PointerEvent } from 'react'
import { KEYPAD_KEYS } from '../editor/keypad.ts'
import type { KeypadKey } from '../editor/keypad.ts'
import { isTapPointer } from '../editor/pointer.ts'
import type { HistoryOp } from '../editor/types.ts'

type PythonKeypadProps = {
  onOp: (op: HistoryOp) => void
}

type PointerTrack = {
  id: number
  x: number
  y: number
  scroll: number
  panning: boolean
}

function KeypadButton({
  keyDef,
  onOp,
  getRibbonScroll,
  setRibbonScroll,
}: {
  keyDef: KeypadKey
  onOp: (op: HistoryOp) => void
  getRibbonScroll: () => number
  setRibbonScroll: (scrollLeft: number) => void
}) {
  const trackRef = useRef<PointerTrack | null>(null)
  const skipClickRef = useRef(false)

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    skipClickRef.current = true
    trackRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scroll: getRibbonScroll(),
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
    setRibbonScroll(track.scroll - (event.clientX - track.x))
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
    if (apply && !track.panning) {
      onOp(keyDef.op)
    }
    window.setTimeout(() => {
      skipClickRef.current = false
    }, 0)
  }

  return (
    <button
      type="button"
      className="keypad-key"
      aria-label={keyDef.ariaLabel}
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
        onOp(keyDef.op)
      }}
    >
      {keyDef.label}
    </button>
  )
}

export function PythonKeypad({ onOp }: PythonKeypadProps) {
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
    <div className="keypad" role="toolbar" aria-label="Python-клавиши">
      <p className="keypad-caption">Python-клавиши</p>
      <div className="keypad-ribbon-wrap">
        <div className="keypad-ribbon" ref={ribbonRef}>
          {KEYPAD_KEYS.map((keyDef) => (
            <KeypadButton
              key={keyDef.id}
              keyDef={keyDef}
              getRibbonScroll={getRibbonScroll}
              setRibbonScroll={setRibbonScroll}
              onOp={onOp}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

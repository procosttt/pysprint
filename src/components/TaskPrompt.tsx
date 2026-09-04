import { prototypeScreenLabel } from '../types/task.ts'
import type { Task, TruthTableFragment } from '../types/task.ts'

function TruthTable({ table }: { table: TruthTableFragment }) {
  return (
    <div className="truth-wrap">
      <table className="truth-table">
        <caption className="truth-caption">Фрагмент таблицы истинности</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Столбец 1</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 2</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 3</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 4</span>
            </th>
            <th scope="col">F</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell === null ? '' : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TaskPromptBody({ task }: { task: Task }) {
  return (
    <>
      {task.prototypeNumber ? (
        <p className="prototype-caption">{prototypeScreenLabel(task.prototypeNumber)}</p>
      ) : null}
      <p className="prompt-text">{task.statement}</p>
      {task.truthTable ? <TruthTable table={task.truthTable} /> : null}
      {task.prototypeNumber ? (
        <p className="prototype-disclaimer">
          Авторская задача по формату ЕГЭ. Не является официальным заданием ФИПИ.
        </p>
      ) : null}
    </>
  )
}

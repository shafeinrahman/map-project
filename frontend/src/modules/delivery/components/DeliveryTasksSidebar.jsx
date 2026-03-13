import { useState } from 'react'

const MOCK_TASKS = [
  {
    id: 1,
    title: 'Deliver to Kampala Central Market',
    address: '14 Market St, Kampala',
    status: 'in-progress',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Drop-off at Garden City Mall',
    address: 'Yusuf Lule Rd, Kampala',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 3,
    title: 'Pickup from Nakumatt Oasis',
    address: '25 Lumumba Ave, Kampala',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 4,
    title: 'Deliver to Makerere University',
    address: 'University Rd, Kampala',
    status: 'pending',
    priority: 'low',
  },
  {
    id: 5,
    title: 'Deliver to Ntinda Complex',
    address: '8 Ntinda Rd, Kampala',
    status: 'completed',
    priority: 'medium',
  },
  {
    id: 6,
    title: 'Drop-off at Acacia Mall',
    address: 'Acacia Ave, Kampala',
    status: 'completed',
    priority: 'low',
  },
]

export function DeliveryTasksSidebar({ isOpen, onToggle }) {
  const [search, setSearch] = useState('')

  const filtered = MOCK_TASKS.filter(
    (task) =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.address.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <aside className={`delivery-sidebar${isOpen ? '' : ' delivery-sidebar--collapsed'}`}>
      <div className="delivery-sidebar-header">
        {isOpen && <h2 className="delivery-sidebar-title">Delivery Tasks</h2>}
        <button
          type="button"
          className="delivery-sidebar-toggle"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="delivery-sidebar-search">
            <input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <ul className="delivery-tasks-list" aria-label="Delivery tasks">
            {filtered.map((task) => (
              <li
                key={task.id}
                className={`delivery-task-item delivery-task-item--${task.status}`}
              >
                <div className="delivery-task-header">
                  <span className="delivery-task-title">{task.title}</span>
                  <span className={`delivery-task-badge delivery-task-badge--${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                <p className="delivery-task-address">{task.address}</p>
                <span className={`delivery-task-status delivery-task-status--${task.status}`}>
                  {task.status.replace('-', '\u00a0')}
                </span>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="delivery-tasks-empty">No tasks found.</li>
            )}
          </ul>
        </>
      )}
    </aside>
  )
}

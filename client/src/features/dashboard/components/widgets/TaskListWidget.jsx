import React, { useState } from 'react';

/**
 * Task list checklist widget with interactive toggling.
 */
const TaskListWidget = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review new lead inquiries', done: false },
    { id: 2, text: 'Restock out-of-stock products', done: true },
    { id: 3, text: 'Submit quarterly sales report', done: false },
    { id: 4, text: 'Configure email notification integrations', done: false }
  ]);

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="task-list-widget">
      <header className="task-list-widget__header">
        <h3 className="task-list-widget__title">Pending Tasks</h3>
        <span className="badge-pill task-count-badge">
          {tasks.filter(t => !t.done).length} left
        </span>
      </header>
      <div className="task-list-widget__body">
        <ul className="task-list-widget__items">
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`task-list-widget__item ${task.done ? 'task-list-widget__item--done' : ''}`}
            >
              <i
                className={task.done ? 'ri-checkbox-circle-fill task-icon task-icon--done' : 'ri-checkbox-blank-circle-line task-icon'}
                aria-hidden="true"
              />
              <span className="task-list-widget__text">{task.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskListWidget;

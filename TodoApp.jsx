import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './TodoApp.css';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    const fetchTasks = async () => {
      const tasksCollection = await getDocs(collection(db, 'tasks'));
      const tasksData = tasksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tasksData.sort((a, b) => priorityToValue(a.priority) - priorityToValue(b.priority));
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  const priorityToValue = (priority) => {
    switch (priority) {
      case 'high':
        return 1;
      case 'medium':
        return 2;
      case 'low':
        return 3;
      default:
        return 4;
    }
  };

  const handleAddTask = async () => {
    if (newTask.trim()) {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = await addDoc(collection(db, 'tasks'), { text: newTask, completed: false, priority, userId: user.uid });
          const newTaskData = { id: docRef.id, text: newTask, completed: false, priority, userId: user.uid };
          setTasks([...tasks, newTaskData].sort((a, b) => priorityToValue(a.priority) - priorityToValue(b.priority)));
          setNewTask('');
          setPriority('medium');
        }
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const taskDoc = doc(db, 'tasks', taskId);
    await updateDoc(taskDoc, { completed: !currentStatus });
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
  };

  const handleDeleteTask = async (taskId) => {
    const taskDoc = doc(db, 'tasks', taskId);
    await deleteDoc(taskDoc);
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="todo-app">
      <h1>To-Do List</h1>
      <div className="todo-input">
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add a new task"
        />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={handleAddTask}>Add Task</button>
      </div>
      <ul className="todo-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'completed' : ''}>
            <span className="task-text" onClick={() => handleToggleTask(task.id, task.completed)}>{task.text}</span>
            <div className="task-controls">
              <span className="priority">{task.priority}</span>
              <button onClick={() => handleToggleTask(task.id, task.completed)}>{task.completed ? 'Undo' : 'Complete'}</button>
              <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;

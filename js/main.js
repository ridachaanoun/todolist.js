import { showCardModal, moveAllCards, archiveList, archiveAllCards, toggleMenu } from './eventHandlers.js';

// DOM Elements
const columnsContainer = document.getElementById('columns-container');
const addColumnBtn = document.getElementById('add-column-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskTitleInput = document.getElementById('task-title');
const taskColumnSelect = document.getElementById('task-column');
const saveTaskBtn = document.getElementById('save-task');
const closeModalBtn = document.getElementById('close-modal');

// Fetch and Render Columns
async function loadColumns() {
  const response = await fetch('http://localhost:3000/columns');
  const columns = await response.json();
  columns.forEach(renderColumn);
  
}

// Fetch and Render Tasks
async function loadTasks() {
  const response = await fetch('http://localhost:3000/tasks');
  const tasks = await response.json();
  tasks.forEach(renderTask);
}

// Render a Column
function renderColumn(column) {
  const columnDiv = document.createElement('div');
  columnDiv.classList.add('bg-gray-900', 'p-4', 'rounded-lg', 'shadow-md', 'w-64', 'space-y-4', 'relative');
  columnDiv.dataset.id = column.id;

  columnDiv.addEventListener('drop', drop);
  columnDiv.addEventListener('dragover', allowDrop);

  columnDiv.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-white font-bold">${column.name}</h3>
      <button class="three-dot-menu relative text-white">⋮</button>
      <div class="menu-options hidden absolute top-8 right-0 bg-white shadow-lg rounded p-2 z-10">
        <button class="add-card block w-full text-left px-4 py-2 hover:bg-gray-100">Add Card</button>
        <button class="move-all-cards block w-full text-left px-4 py-2 hover:bg-gray-100">Move All Cards</button>
        <button class="archive-list block w-full text-left px-4 py-2 hover:bg-gray-100">Archive List</button>
        <button class="archive-all-cards block w-full text-left px-4 py-2 hover:bg-gray-100">Archive All Cards</button>
      </div>
    </div>
    <div class="task-list space-y-2"></div>
  `;

  columnsContainer.appendChild(columnDiv);

  // Attach the event listener for the three-dot menu
  const menuButton = columnDiv.querySelector('.three-dot-menu');
  menuButton.addEventListener('click', toggleMenu);

  // Attach event listeners for buttons in the menu
  columnDiv.querySelector('.add-card').addEventListener('click', () => showCardModal(column.id));
  columnDiv.querySelector('.move-all-cards').addEventListener('click', () => moveAllCards(column.id));
  columnDiv.querySelector('.archive-list').addEventListener('click', () => archiveList(column.id));
  columnDiv.querySelector('.archive-all-cards').addEventListener('click', () => archiveAllCards(column.id));

  // Update task column dropdown in modal
  const option = document.createElement('option');
  option.value = column.id;
  option.textContent = column.name;
  taskColumnSelect.appendChild(option);
}

// Render a Task
function renderTask(task) {
  const taskContainer = document.querySelector(`[data-id='${task.status}']`);
  if (!taskContainer) return;

  const taskDiv = document.createElement('div');
  taskDiv.classList.add('border', 'p-3', 'rounded-lg', 'bg-gray-700', 'flex', 'justify-between', 'items-center','task');
  taskDiv.dataset.id = task.id;
  taskDiv.setAttribute('draggable', 'true');
  // taskDiv.setAttribute('ondragstart', 'drag(event)');
  taskDiv.addEventListener('dragstart', drag);
  taskDiv.innerHTML = `
    <div>
      <span class="text-white font-bold task-title">${task.title}</span>
      <p class="text-gray-400 ">Due: ${task.dueDate}</p>
      <p class="text-gray-400 task-description">Priority: ${task.priority}</p>
    </div>
    <button type="button" class="bg-red-500 text-white px-2 py-1 rounded delete-btn">Delete</button>
  `;

  // Append the task to the container
  taskContainer.appendChild(taskDiv);

  // Select the delete button within the current task div and add an event listener
  taskDiv.querySelector('.delete-btn').addEventListener('click', async () => {
    await deleteTask(task.id);
  });
}

// Function to delete the task from the backend
async function deleteTask(taskId) {
  try {
    const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      console.log(`Task ${taskId} deleted successfully`);
    } else {
      console.error('Failed to delete the task');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Event: Add New Column
addColumnBtn.addEventListener('click', async () => {
  const columnName = prompt("Enter column name:");
  if (!columnName) return;

  const newColumn = { name: columnName };
  const response = await fetch('http://localhost:3000/columns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newColumn)
  });

  const savedColumn = await response.json();
  renderColumn(savedColumn);
});

// Event: Show Modal for Adding Task
addTaskBtn.addEventListener('click', () => {
  taskModal.classList.remove('hidden');

});

// Event: Close Modal
closeModalBtn.addEventListener('click', () => {
  taskModal.classList.add('hidden');
  taskTitleInput.value = '';
  taskColumnSelect.value = '';
});

saveTaskBtn.addEventListener('click', async () => {
  const title = taskTitleInput.value;
  const description = document.getElementById('task-description').value; // New field
  const status = taskColumnSelect.value;
  const dueDate = document.getElementById('task-due-date').value; // New field
  const priority = document.getElementById('task-priority').value; // New field

  if (!title || !status) return;

  // const newTask = { title, description, status, dueDate, priority };
  const newTask = { id: generateId(), title, description, status, dueDate, priority }; 
  const response = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask)
  });

  const savedTask = await response.json();
  renderTask(savedTask);

  // Close the modal
  taskModal.classList.add('hidden');
  taskTitleInput.value = '';
  taskColumnSelect.value = '';
  document.getElementById('task-description').value = ''; // Clear description
  document.getElementById('task-due-date').value = ''; // Clear due date
  document.getElementById('task-priority').value = 'low'; // Reset priority
});


// Drag and Drop Functions

function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("text", event.target.dataset.id);
}
function drop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  const taskDiv = document.querySelector(`[data-id='${taskId}']`);

  // Check if the drop target is a valid column with data-status

  const targetColumn = event.target.closest('[data-id]');
  
  if (targetColumn && taskDiv) {
      targetColumn.querySelector('.task-list').appendChild(taskDiv); // Append to the task list within the column
      const newStatus = targetColumn.getAttribute('data-id');
      updateTaskStatus(taskId, newStatus);
  } else {
      console.log("Drop area not recognized or taskDiv not found.");
  }
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    await fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (error) {
    console.error('Error updating task status:', error);
  }
}

// Initial Load

loadColumns();
loadTasks();

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  
  searchBar.addEventListener('input', () => {
    const searchQuery = searchBar.value.toLowerCase();
    const tasks = document.querySelectorAll('.task'); // Assuming tasks have a class 'task'
  // console.log(tasks);
    
    tasks.forEach(task => {
      const title = task.querySelector('.task-title').innerText.toLowerCase();
      const description = task.querySelector('.task-description').innerText.toLowerCase();
      
      if (title.includes(searchQuery) || description.includes(searchQuery)) {
        task.style.display = ''; // Show task
      } else {
        task.style.display = 'none'; // Hide task
      }
    });
  });
});

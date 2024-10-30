// eventHandlers.js

// Function to show the card modal
export function showCardModal(columnId) {
  const cardModal = document.getElementById('card-modal');
  const saveCardBtn = document.getElementById('save-card');
  const closeCardModalBtn = document.getElementById('close-card-modal');
  const cardTitleInput = document.getElementById('card-title');

  // Show the modal
  cardModal.classList.remove('hidden');
  const menuButton = document.querySelector('.menu-options');

  menuButton.classList.toggle("hidden");
  // Event: Close Modal
  closeCardModalBtn.addEventListener('click', () => {
    cardModal.classList.add('hidden');
    clearCardModalInputs();
  });

  // Event: Save Card
  saveCardBtn.addEventListener('click', async () => {
    const cardTitle = cardTitleInput.value;

    if (!cardTitle) return;

    const newCard = { title: cardTitle, status: columnId }; // assuming 'status' corresponds to the column ID

    const response = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCard),
    });

    if (response.ok) {
      const savedCard = await response.json();
      alert(`Card added to column ${columnId}: ${savedCard.title}`);
      // Optionally render the new card immediately
      // renderTask(savedCard); // Uncomment if you want to render it immediately
      cardModal.classList.add('hidden');
      clearCardModalInputs();
    } else {
      alert("Failed to add card.");
    }
  });
}

// Function to clear card modal inputs
function clearCardModalInputs() {
  document.getElementById('card-title').value = '';
}

// Call this function where you want to open the modal
// Example usage: showCardModal(columnId);

export async function moveList(columnId) {
  const newColumnId = prompt("Enter the new column ID to move this list to:");
  if (!newColumnId) return;

  const response = await fetch(`http://localhost:3000/columns/${columnId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: newColumnId }), // Assuming you're just updating the column's ID
  });

  if (response.ok) {
    alert(`Moved list ${columnId} to column ${newColumnId}`);
    // Optionally, you might want to refresh the columns view or implement logic to move the list in the UI
  } else {
    alert("Failed to move list.");
  }
}

export async function moveAllCards(currentColumnId) {
  try {
    // Fetch available columns
    const response = await fetch('http://localhost:3000/columns'); // Adjust this endpoint if necessary
    const columns = await response.json();

    // Populate the modal with column options, excluding the current column
    const columnList = document.getElementById('column-list');
    columnList.innerHTML = ''; // Clear existing options

    columns.forEach(column => {
      if (column.id !== currentColumnId) { // Exclude current column as a target
        const li = document.createElement('li');
        li.className = 'mb-2';
        li.innerHTML = `
          <button class="text-blue-600 hover:text-blue-800" onclick="selectColumn('${currentColumnId}', '${column.id}')">
            ${column.name} 
          </button>
        `;
        columnList.appendChild(li);
      }
    });

    // Show the modal
    const modal = document.getElementById('target-column-modal');
    modal.classList.remove('hidden');

    // Close modal functionality
    document.getElementById('close-modal-btn').onclick = () => {
      modal.classList.add('hidden');
    };
  } catch (error) {
    console.error('Error loading columns:', error);
    alert("Failed to load columns.");
  }
}

window.selectColumn = async function(currentColumnId, targetColumnId) {
  // try {
    const response = await fetch(`http://localhost:3000/tasks?status=${currentColumnId}`);
    const cards = await response.json();

    await Promise.all(cards.map(card => {
      return fetch(`http://localhost:3000/tasks/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId }),
      });
    }));

    alert(`Moved all cards Moved `);

};



export async function archiveList(columnId) {
  const response = await fetch(`http://localhost:3000/columns/${columnId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    alert(`Archived list ${columnId}`);
    // Remove the column from the UI
    const columnDiv = document.querySelector(`[data-id='${columnId}']`);
    if (columnDiv) columnDiv.remove();
  } else {
    alert("Failed to archive list.");
  }
}

export async function archiveAllCards(columnId) {
  // Fetch all cards in the column
  const response = await fetch(`http://localhost:3000/tasks?status=${columnId}`);
  const cards = await response.json();

  // Archive each card
  await Promise.all(cards.map(card => {
    return fetch(`http://localhost:3000/tasks/${card.id}`, {
      method: 'DELETE',
    });
  }));

  alert(`Archived all cards in list ${columnId}`);
}

export function toggleMenu(event) {
  const menu = event.target.nextElementSibling;
  menu.classList.toggle('hidden');
}

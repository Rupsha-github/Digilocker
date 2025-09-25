
  document.addEventListener('DOMContentLoaded', () => {
    attachFolderEvents();
  });

  function attachFolderEvents() {
    document.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const folderId = item.getAttribute('data-id');
        window.location.href = `/folder/${folderId}`;
      });
    });

    document.querySelectorAll('.open-folder-btn').forEach(button => {
    button.addEventListener('click', () => {
      const folderId = button.getAttribute('data-id');
      window.location.href = `/folder/${folderId}`;
      });
    });
  }

  const deleteFolderModal = document.getElementById('deleteFolderModal');
  deleteFolderModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const folderId = button.getAttribute('data-id');
    const folderName = button.getAttribute('data-name');

    document.getElementById('folderName').textContent = folderName;
    document.getElementById('deleteFolderForm').action = `/delete-folder/${folderId}`;
  });

  const folderSearch = document.getElementById('folderSearch');
  const folderList = document.getElementById('folderList');
  const folderEmpty = document.getElementById('folderEmpty');

  folderSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      folderSearch.dispatchEvent(new Event('keyup'));
    }
  });

  document.querySelector('.btn-warning').addEventListener('click', () => {
    folderSearch.dispatchEvent(new Event('keyup'));
  });

  let folderTimer;
  folderSearch.addEventListener('keyup', () => {
    clearTimeout(folderTimer);
    folderTimer = setTimeout(() => {
      const term = folderSearch.value.trim();

      if (term === '') {
        window.location.reload();
        return;
      }

      fetch(`/search-folders?term=${encodeURIComponent(term)}`)
        .then(res => res.json())
        .then(data => {
          folderList.innerHTML = '';
          if (data.length === 0) {
            folderEmpty.style.display = 'block';
          } else {
            folderEmpty.style.display = 'none';
            data.forEach(folder => {
              const li = document.createElement('li');
              li.className = 'list-group-item folder-item d-flex justify-content-between align-items-center mb-2 search-match';
              li.setAttribute('data-id', folder.id);
              li.innerHTML = `
                <span>${folder.name}</span>
                <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#deleteFolderModal" data-id="${folder.id}" data-name="${folder.name}" title="Delete folder">
                  <img width="22" height="22" src="https://img.icons8.com/material-rounded/24/FFFFFF/filled-trash.png" alt="filled-trash"/>
                  <i class="bi bi-trash"></i>
                </button>
              `;
              folderList.appendChild(li);
            });
            attachFolderEvents(); // ✅ re-attach after rendering
          }
        })
        .catch(err => {
          console.error('Search failed:', err);
          folderList.innerHTML = '';
          folderEmpty.style.display = 'block';
        });
    }, 300);
  });

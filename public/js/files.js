document.addEventListener('DOMContentLoaded', () => {
  const fileModal = document.getElementById('fileModal');
  const deleteFileModal = document.getElementById('deleteFileModal');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const fileError = document.getElementById('fileError');
  const fileSearch = document.getElementById('fileSearch');
  const fileList = document.getElementById('fileList');
  const fileEmpty = document.getElementById('fileEmpty');
  const folderId = document.getElementById('fileContainer').getAttribute('data-folder-id');

  // Preview modal
  fileModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const fileId = button.getAttribute('data-id');
    const fileName = button.closest('li').querySelector('span').textContent;
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'pdf' && window.innerWidth < 576) {
        // Prevent modal from opening
        event.preventDefault();

        // Open PDF in new tab
        window.open(`/view-file/${fileId}`, '_blank');
        return;
    }

    const wrapper = document.getElementById('fileViewerWrapper');
    wrapper.innerHTML = ''; // Clear previous preview

    if (ext === 'pdf') {
        const embed = document.createElement('embed');
        embed.src = `/view-file/${fileId}`;
        embed.type = 'application/pdf';
        embed.width = '100%';
        embed.height = '80vh';
        embed.style.border = 'none';
        wrapper.appendChild(embed);
    } else {
        const img = document.createElement('img');
        img.src = `/view-file/${fileId}`;
        img.alt = 'File preview';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '80vh';
        img.style.objectFit = 'contain';
        wrapper.appendChild(img);
    }
});

  fileModal.addEventListener('hidden.bs.modal', () => {
    document.getElementById('fileViewerWrapper').innerHTML = '';
  });

  // Delete modal
  deleteFileModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const fileId = button.getAttribute('data-id');
    const fileName = button.getAttribute('data-name');

    document.getElementById('fileName').textContent = fileName;
    document.getElementById('deleteFileForm').action = `/delete-file/${fileId}`;
  });

  // File size validation
  uploadForm.addEventListener('submit', function (e) {
    const file = fileInput.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      e.preventDefault();
      fileError.hidden = false;
      fileInput.classList.add('is-invalid');
    } else {
      fileError.hidden = true;
      fileInput.classList.remove('is-invalid');
    }
  });

  // AJAX search with debounce
  fileSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fileSearch.dispatchEvent(new Event('keyup'));
    }
  });

  document.querySelector('.btn-warning').addEventListener('click', () => {
    fileSearch.dispatchEvent(new Event('keyup'));
  });

  let fileTimer;
  fileSearch.addEventListener('keyup', () => {
    clearTimeout(fileTimer);
    fileTimer = setTimeout(() => {
      const term = fileSearch.value.trim();

      if (term === '') {
        window.location.reload();
        return;
      }

      fetch(`/search-files/${folderId}?term=${encodeURIComponent(term)}`)
        .then(res => res.json())
        .then(data => {
          fileList.innerHTML = '';
          if (data.length === 0) {
            fileEmpty.style.display = 'block';
          } else {
            fileEmpty.style.display = 'none';
            data.forEach(file => {
              const li = document.createElement('li');
              li.className = 'list-group-item file-item d-flex justify-content-between align-items-center mb-2 search-match';
              li.setAttribute('data-id', file.id);
              li.innerHTML = `
                <span>${file.filename}</span>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#fileModal" data-id="${file.id}" title="File Preview">
                    <img width="20" height="20" src="https://img.icons8.com/ios-filled/50/FFFFFF/file-preview.png" alt="file-preview"/>
                  </button>
                  <a href="/download-file/${file.id}" class="btn px-2 btn-sm btn-success" title="Download File">
                    <img width="22" height="22" src="https://img.icons8.com/material-sharp/24/FFFFFF/download--v1.png" alt="download--v1"/>
                  </a>
                  <button class="btn btn-sm btn-danger px-2.5" title="Delete File"
                          data-bs-toggle="modal"
                          data-bs-target="#deleteFileModal"
                          data-id="${file.id}"
                          data-name="${file.filename}">
                    <img width="22" height="22" src="https://img.icons8.com/material-rounded/24/FFFFFF/filled-trash.png" alt="filled-trash"/>
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              `;
              fileList.appendChild(li);
            });
          }
        })
        .catch(err => {
          console.error('Search failed:', err);
          fileList.innerHTML = '';
          fileEmpty.style.display = 'block';
        });
    }, 300);
  });
});

// Client-side logic to upload an image, call /translate-image, and display results
const fileInput = document.getElementById('file');
const dropZone = document.getElementById('drop');
const translateBtn = document.getElementById('translateBtn');
const origImg = document.getElementById('orig');
const outImg = document.getElementById('out');
const progress = document.getElementById('progress');
const errorBox = document.getElementById('error');

let currentFile = null;

// helpers
function showError(msg) {
  if (!msg) {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
    return;
  }
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function setLoading(active) {
  if (active) {
    progress.classList.remove('hidden');
    translateBtn.disabled = true;
  } else {
    progress.classList.add('hidden');
    translateBtn.disabled = !currentFile;
  }
}

function setFile(file) {
  currentFile = file || null;
  showError('');
  outImg.src = '';
  if (currentFile) {
    origImg.src = URL.createObjectURL(currentFile);
    translateBtn.disabled = false;
  } else {
    origImg.src = '';
    translateBtn.disabled = true;
  }
}

// drag-and-drop
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const f = e.dataTransfer?.files?.[0];
  if (f && f.type.startsWith('image/')) setFile(f);
  else showError('Please drop a valid image file.');
});

// file picker
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) return showError('Please choose an image file.');
  setFile(f);
});

// main action
translateBtn.addEventListener('click', async () => {
  if (!currentFile) return showError('Select an image first.');

  try {
    setLoading(true);
    const form = new FormData();
    form.append('image', currentFile);

    const res = await fetch('/translate-image', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Server error (${res.status})`);
    }

    const blob = await res.blob();
    outImg.src = URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    showError(err.message || 'Translation failed.');
  } finally {
    setLoading(false);
  }
});

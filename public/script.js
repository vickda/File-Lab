document.addEventListener('DOMContentLoaded', () => {
  const fileList = document.getElementById('fileList');
  const fileInput = document.getElementById('fileInput');
  const overwriteCheckbox = document.getElementById('overwriteCheckbox');
  const fileupload = document.getElementById('fileInput');

  let route;

  document.getElementById('submit').addEventListener('click', () => {
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // formData.append('override', overwriteCheckbox);

    if(overwriteCheckbox.checked) route = "/upload";
    else route = "/uploadduplicate";

    fetch(route, {
      method: 'POST',
      body: formData,
    })
    .then((response) => response.text())
    .then((message) => {
      alert("File Uploaded");
      refreshFileList();
    })
    .catch((error) => console.error(error));
  });

  // Fetch and display the list of files
  function refreshFileList() {
    fetch('/files')
      .then((response) => response.json())
      .then((files) => {
        fileupload.value = ''
        fileList.innerHTML = ''; // Clear the current list
        files.forEach((file) => {
          const li = document.createElement('li');
          li.textContent = file;

          // Downloading Logic
          const downloadButton = document.createElement('button');
          downloadButton.textContent = 'Download';
          downloadButton.addEventListener('click', () => {
            window.location.href = `/download/${file}`;
          });

          // Deleting file logic
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', () => {
            deleteFile(file, li);
          });

          li.appendChild(downloadButton);
          li.appendChild(deleteButton);
          fileList.appendChild(li);
        });
      })
      .catch((error) => console.error(error));
  }

  // Function to handle file deletion
  function deleteFile(filename, listItem) {
    fetch(`/delete/${filename}`, { method: 'DELETE' })
      .then((response) => response.text())
      .then((message) => {
        alert(message);
        listItem.remove();
      })
      .catch((error) => console.error(error));
  }

  // Initial file list refresh
  refreshFileList();
});

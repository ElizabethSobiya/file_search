let files = [];
let idx; // lunr index

let selectedFiles = [];
let documents = [];
let filteredDocuments = []; // Store filtered documents


function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  files = event.dataTransfer.files;
  displayFileNames(); 
}

function addFiles(event) {
  files = event.target.files; // Update the files array with the selected files
  displayFileNames(); // Display selected file names and count
}

function displayFileNames() {
  const fileNamesElement = document.getElementById("fileNames");
  const selectedFilesDisplay = document.getElementById("selectedFilesDisplay");

  fileNamesElement.innerHTML = "";
  selectedFilesDisplay.innerHTML = "";

  files = Array.from(files); // Convert to an array
  files.forEach((file, index) => {
    const fileNameDiv = document.createElement("div");
    fileNameDiv.textContent = `File ${index + 1}: ${file.name}`;
    fileNamesElement.appendChild(fileNameDiv);
  });

  // Display selected files count
  const selectedFilesInfo = document.getElementById("selectedFilesInfo");
  selectedFilesInfo.textContent = `Selected Files: ${files.length}`;
}

async function processAndSearch() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  documents = []; // Clear previous documents
  document.getElementById("fileNames").innerHTML = ""; // Clear previous file names
 console.log(files, 'files')
  const textPromises = files.map(async (file) => {
    let text;

    if (file.type === "application/pdf") {
      console.log('pdf')
      text = await extractTextFromPDF(file);
      console.log(text, 'texxt')
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await extractTextFromDOC(file);
    }

    documents.push({ id: file.name, text: text });
  });

  // Wait for all text extraction promises to resolve
  await Promise.all(textPromises);

  // Create an index for all documents
  idx = lunr(function () {
    this.ref("id");
    this.field("text");
    documents.forEach((doc) => this.add(doc), this);
  });

  search();
  loader.style.display = "none";
}


async function extractTextFromPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((item) => item.str).join(" ");
  }
 console.log(textContent, 'text')
  return textContent;
}

async function extractTextFromDOC(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const arrayBuffer = event.target.result;

      mammoth
        .extractRawText({ arrayBuffer: arrayBuffer })
        .then((result) => resolve(result.value))
        .catch((error) => reject(error));
    };

    reader.onerror = function (event) {
      reject(new Error("File could not be read: " + event.target.error));
    };

    reader.readAsArrayBuffer(file);
  });
}
function search() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  if (!idx) return; // If the index is not ready, return early
  const query = document.getElementById("searchInput").value;
  console.log("Search query: " + query);

  const keywords = query.split(',').map(keyword => keyword.trim().toLowerCase());

  const matchingFileNames = new Set(); // Use a Set to store unique matching file names

  documents.forEach((doc) => {
    const text = doc.text.toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchingFileNames.add(doc.id);
        break; // If one keyword is found in the document, consider it a match and move to the next document
      }
    }
  });

  const resultElement = document.getElementById("result");
  const fileNamesElement = document.getElementById("fileNames");

  resultElement.innerHTML = ""; 
  fileNamesElement.innerHTML = "";

  if (matchingFileNames.size === 0) {
    resultElement.innerHTML = "No matching documents found.";
  } else {
    fileNamesElement.innerHTML = "Matching File Names:";
    matchingFileNames.forEach((fileName, index) => {
      const fileNameDiv = document.createElement("div");
      fileNameDiv.textContent = `${fileName}`;
      fileNamesElement.appendChild(fileNameDiv);
    });
  }
  loader.style.display = "none";
}



function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(
    regex,
    '<span style="background-color: yellow">$1</span>'
  );
}



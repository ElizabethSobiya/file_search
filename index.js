let files = [];
let idx; // lunr index


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
  documents = []; // Clear previous documents
  document.getElementById("fileNames").innerHTML = ""; // Clear previous file names

  for (let file of selectedFiles) {
    // Process each selected file
    let text;
    if (file.type === "application/pdf") {
      text = await extractTextFromPDF(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await extractTextFromDOC(file);
    }
    documents.push({ id: file.name, text: text });
  }

  // Display selected file names
  displayFileNames();

  // Create an index for all documents
  idx = lunr(function () {
    this.ref("id");
    this.field("text");
    documents.forEach((doc) => this.add(doc), this);
  });

  // Now that we've processed the documents, let's perform an initial search
  search();
}

// ... (rest of your code)


let filteredDocuments = []; // Store filtered documents


async function extractTextFromPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((item) => item.str).join(" ");
  }

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

let selectedFiles = []; // Store selected files
let documents = [];

function search() {
  if (!idx) return; // If the index is not ready, return early

  const query = document.getElementById("searchInput").value;
  const results = idx.search(query);

  const resultElement = document.getElementById("result");
  const fileNamesElement = document.getElementById("fileNames");

  resultElement.innerHTML = ""; // Clear previous results
  fileNamesElement.innerHTML = ""; // Clear previous file names

  if (results.length === 0) {
    resultElement.innerHTML = "No matching documents found.";
  } else {
    results.forEach((result) => {
      const matchingDocument = documents.find((doc) => doc.id === result.ref);
      if (matchingDocument) {
        const documentDiv = document.createElement("div");
        // const highlightedText = highlightText(matchingDocument.text, query);
        // documentDiv.innerHTML = `<strong>${result.ref}:</strong><br>${highlightedText}`;
        // resultElement.appendChild(documentDiv);

        // Display the file name in the fileNamesElement
        const fileNameDiv = document.createElement("div");
        fileNameDiv.textContent = `File Name: ${result.ref}`;
        fileNamesElement.appendChild(fileNameDiv);
      }
    });
  }
}

// ... (rest of your code, including the extractTextFromPDF and extractTextFromDOC functions)


function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(
    regex,
    '<span style="background-color: yellow">$1</span>'
  );
}

// Initialize a variable to store filter words
let filterWords = [];

// Function to apply filters to the displayed documents
function applyFilters() {
  // Get the filter input
  const filterInput = document.getElementById("filterInput").value;
  const filterArray = filterInput.split(/\s+/).filter(word => word.trim() !== '');

  // Clear previous results
  const resultElement = document.getElementById("result");
  resultElement.innerHTML = "";

  if (filterArray.length === 0) {
    // No filters provided, display all documents
    documents.forEach(doc => displayDocument(doc));
  } else {
    // Apply filters and display matching documents
    documents.forEach(doc => {
      if (filterArray.every(filter => doc.text.toLowerCase().includes(filter.toLowerCase()))) {
        displayDocument(doc);
      }
    });
  }
}

// Function to display a filtered document
function displayDocument(doc) {
  const resultElement = document.getElementById("result");
  const documentDiv = document.createElement("div");
  documentDiv.innerHTML = `<strong>${doc.id}:</strong><br>${highlightText(doc.text)}`;
  resultElement.appendChild(documentDiv);
}

// ... (rest of your code, including the extractTextFromPDF, extractTextFromDOC, and highlightText functions)

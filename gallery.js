import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { initialGalleryImages } from "./gallery-data.js";
import { galleryFolders, uncategorizedGalleryFolder } from "./services-data.js";

const galleryGrid = document.getElementById("galleryGrid");
const galleryStatus = document.getElementById("galleryStatus");
const initialGalleryCategories = new Map(initialGalleryImages.map((image) => [image.id, image.category]));

function renderImages(images) {
  galleryGrid.replaceChildren();

  const folders = new Map([
    ...galleryFolders.map((folder) => [folder, []]),
  ]);
  images.forEach((image) => {
    const category = folders.has(image.category)
      ? image.category
      : initialGalleryCategories.get(image.id);
    if (folders.has(category)) {
      folders.get(category).push(image);
    }
  });

  folders.forEach((folderImages, category) => {
    if (folderImages.length === 0) return;
    const folder = document.createElement("section");
    folder.className = "gallery-category";
    const headingRow = document.createElement("div");
    headingRow.className = "gallery-category-heading-row";
    const heading = document.createElement("h2");
    heading.className = "gallery-category-heading";
    heading.textContent = category;
    headingRow.append(heading);
    if (galleryFolders.includes(category)) {
      const addImagesLink = document.createElement("a");
      addImagesLink.className = "button button-outline gallery-folder-add";
      addImagesLink.href = `admin.html?category=${encodeURIComponent(category)}#galleryManager`;
      addImagesLink.textContent = "Add images ↗";
      headingRow.append(addImagesLink);
    }
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    grid.id = `gallery-category-${galleryFolders.indexOf(category)}`;

    folderImages.forEach((image) => {
      const element = document.createElement("img");
      element.src = image.url || image.src;
      element.alt = image.alt || image.title || "Merlin Art N Texture project";
      element.title = image.title || "";
      element.loading = "lazy";
      element.hidden = grid.children.length >= 4;
      grid.append(element);
    });
    folder.append(headingRow);
    folder.append(grid);
    if (folderImages.length > 4) {
      grid.classList.add("gallery-grid-collapsed");

      const showMoreButton = document.createElement("button");
      showMoreButton.type = "button";
      showMoreButton.className = "button button-outline gallery-show-more";
      showMoreButton.textContent = `View more photos (${folderImages.length - 4})`;
      showMoreButton.setAttribute("aria-controls", grid.id);
      showMoreButton.setAttribute("aria-expanded", "false");
      showMoreButton.addEventListener("click", () => {
        const isExpanded = showMoreButton.getAttribute("aria-expanded") !== "true";
        showMoreButton.setAttribute("aria-expanded", String(isExpanded));
        showMoreButton.textContent = isExpanded ? "Show fewer photos" : `View more photos (${folderImages.length - 4})`;
        grid.classList.toggle("gallery-grid-collapsed", !isExpanded);
        Array.from(grid.children).forEach((image, index) => {
          image.hidden = !isExpanded && index >= 4;
        });
      });
      folder.append(showMoreButton);
    }
    galleryGrid.append(folder);
  });
  galleryStatus.hidden = true;
  galleryStatus.textContent = "";
}

async function loadManagedGallery() {
  try {
    const setup = await getDoc(doc(db, "galleryMeta", "initialContent"));
    if (!setup.exists()) return;

    onSnapshot(
      query(collection(db, "gallery"), orderBy("order")),
      (snapshot) => {
        renderImages(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
      },
      (error) => {
        console.error("Could not load gallery images from Firestore.", error);
        galleryStatus.hidden = false;
        galleryStatus.textContent = "Gallery images could not be loaded. Please try again later.";
      },
    );
  } catch (error) {
    console.error("Could not check for managed gallery content.", error);
    galleryStatus.hidden = false;
    galleryStatus.textContent = "Gallery images could not be loaded. Please try again later.";
  }
}

if (galleryGrid && galleryStatus) {
  renderImages(initialGalleryImages.map((image) => ({
    ...image,
    category: image.category || uncategorizedGalleryFolder,
  })));
  loadManagedGallery();
}

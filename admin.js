import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  collection,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import {
  deleteObject,
  getBytes,
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";
import { app, db } from "./firebase.js";
import { initialGalleryImages } from "./gallery-data.js";
import { galleryFolders, services, uncategorizedGalleryFolder } from "./services-data.js";

const auth = getAuth(app);
const loginPanel = document.getElementById("loginPanel");
const dashboardPanel = document.getElementById("dashboardPanel");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginStatus = document.getElementById("loginStatus");
const listStatus = document.getElementById("listStatus");
const enquiryList = document.getElementById("enquiryList");
const searchInput = document.getElementById("searchEnquiries");
const statusFilter = document.getElementById("statusFilter");
const signOutButton = document.getElementById("signOutButton");
const galleryForm = document.getElementById("galleryForm");
const addGalleryButton = document.getElementById("addGalleryButton");
const galleryStatus = document.getElementById("galleryStatus");
const galleryAdminList = document.getElementById("galleryAdminList");
const galleryCategoryInput = galleryForm.elements.namedItem("category");
const storage = getStorage(app);
const counts = {
  total: document.getElementById("totalCount"),
  new: document.getElementById("newCount"),
  progress: document.getElementById("progressCount"),
  completed: document.getElementById("completedCount"),
};

let enquiries = [];
let stopListening = null;
let stopGalleryListening = null;
let galleryImages = [];

const statusLabels = {
  new: "New",
  "in-progress": "In progress",
  completed: "Completed",
};

function displayError(error) {
  if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
    return "That email and password combination wasn't recognized.";
  }
  if (error.code === "auth/too-many-requests") {
    return "Too many sign-in attempts. Please wait a while and try again.";
  }
  if (error.code === "permission-denied") {
    return "This account is not authorized to manage this content. Ask the Firebase project owner to grant admin access.";
  }
  if (error.code === "storage/unauthorized") {
    return "Image storage denied this upload. Deploy storage.rules and confirm this account has the admin role.";
  }
  return "Something went wrong. Please try again.";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setGalleryStatus(message) {
  galleryStatus.hidden = false;
  galleryStatus.textContent = message;
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function renderEnquiries() {
  enquiryList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const filtered = enquiries.filter((enquiry) => {
    const status = enquiry.status || "new";
    const matchesStatus = selectedStatus === "all" || selectedStatus === status;
    const searchable = [enquiry.name, enquiry.phone, enquiry.email, enquiry.service, enquiry.message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && searchable.includes(searchTerm);
  });

  if (filtered.length === 0) {
    listStatus.hidden = false;
    listStatus.textContent = enquiries.length === 0
      ? "No enquiries yet. New customer requests will appear here."
      : "No enquiries match those filters.";
    return;
  }

  listStatus.hidden = true;
  filtered.forEach((enquiry) => {
    const card = makeElement("article", "enquiry-card");
    const top = makeElement("div", "enquiry-card-top");
    const titleBlock = makeElement("div");
    titleBlock.append(
      makeElement("h3", "enquiry-name", enquiry.name || "Unnamed customer"),
      makeElement("p", "enquiry-date", formatDate(enquiry.createdAt)),
    );

    const statusControl = makeElement("div", "enquiry-status-control");
    const statusLabel = makeElement("label", "visually-hidden", `Status for ${enquiry.name || "enquiry"}`);
    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", `Status for ${enquiry.name || "enquiry"}`);
    statusSelect.className = `status-select status-${enquiry.status || "new"}`;
    Object.entries(statusLabels).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === (enquiry.status || "new");
      statusSelect.append(option);
    });
    statusLabel.htmlFor = `status-${enquiry.id}`;
    statusSelect.id = `status-${enquiry.id}`;
    statusSelect.addEventListener("change", () => saveStatus(enquiry.id, statusSelect));
    statusControl.append(statusLabel, statusSelect);
    top.append(titleBlock, statusControl);

    const details = makeElement("div", "enquiry-details");
    details.append(
      makeElement("p", "enquiry-service", enquiry.service || "Service not specified"),
      makeElement("p", "enquiry-contact", `Phone: ${enquiry.phone || "Not provided"}`),
      makeElement("p", "enquiry-contact", `Email: ${enquiry.email || "Not provided"}`),
      makeElement("p", "enquiry-contact", `SMS consent: ${enquiry.smsConsent === true ? "Yes" : "Not given"}`),
    );
    card.append(top, details);
    if (enquiry.message) {
      const message = makeElement("p", "enquiry-message", enquiry.message);
      message.setAttribute("aria-label", "Project details");
      card.append(message);
    }

    const actions = makeElement("div", "enquiry-actions");
    const editButton = makeElement("button", "button button-outline", "Edit details");
    editButton.type = "button";
    editButton.addEventListener("click", () => renderEnquiryEditor(enquiry, card));
    const deleteButton = makeElement("button", "button button-outline", "Delete request");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => removeEnquiry(enquiry, deleteButton));
    actions.append(editButton, deleteButton);
    card.append(actions);
    enquiryList.append(card);
  });
}

function renderEnquiryEditor(enquiry, card) {
  const form = document.createElement("form");
  form.className = "enquiry-edit-form";

  const fields = [
    { name: "name", label: "Customer name", type: "text", required: true, maxLength: 120, value: enquiry.name || "" },
    { name: "phone", label: "Phone", type: "tel", required: true, maxLength: 20, minLength: 7, value: enquiry.phone || "" },
    { name: "email", label: "Email", type: "email", required: false, maxLength: 254, value: enquiry.email || "" },
  ];
  fields.forEach((field) => {
    const label = makeElement("label", "", field.label);
    const input = document.createElement("input");
    input.name = field.name;
    input.type = field.type;
    input.required = field.required;
    input.maxLength = field.maxLength;
    if (field.minLength) input.minLength = field.minLength;
    input.value = field.value;
    label.append(input);
    form.append(label);
  });

  const serviceLabel = makeElement("label", "", "Service required");
  const serviceInput = document.createElement("select");
  serviceInput.name = "service";
  serviceInput.required = true;
  services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service;
    option.textContent = service;
    option.selected = service === enquiry.service;
    serviceInput.append(option);
  });
  serviceLabel.append(serviceInput);
  form.append(serviceLabel);

  const messageLabel = makeElement("label", "enquiry-project-details", "Project details");
  const messageInput = document.createElement("textarea");
  messageInput.name = "message";
  messageInput.maxLength = 2000;
  messageInput.rows = 4;
  messageInput.value = enquiry.message || "";
  messageLabel.append(messageInput);
  form.append(messageLabel);

  const consentLabel = makeElement("label", "enquiry-consent", "SMS consent");
  const consentInput = document.createElement("input");
  consentInput.name = "smsConsent";
  consentInput.type = "checkbox";
  consentInput.checked = enquiry.smsConsent === true;
  consentLabel.append(consentInput);
  form.append(consentLabel);

  const actions = makeElement("div", "enquiry-actions");
  const saveButton = makeElement("button", "button button-gold", "Save changes");
  saveButton.type = "submit";
  const cancelButton = makeElement("button", "button button-outline", "Cancel");
  cancelButton.type = "button";
  cancelButton.addEventListener("click", renderEnquiries);
  actions.append(saveButton, cancelButton);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEnquiry(enquiry, form, saveButton);
  });

  card.append(form);
  form.querySelector("input[name='name']").focus();
}

async function saveEnquiry(enquiry, form, button) {
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const updates = {
    name: String(formData.get("name")).trim(),
    phone: String(formData.get("phone")).trim(),
    email: String(formData.get("email")).trim(),
    service: String(formData.get("service")),
    message: String(formData.get("message")).trim(),
    smsConsent: formData.get("smsConsent") === "on",
    updatedAt: serverTimestamp(),
  };
  if (!updates.name) {
    listStatus.hidden = false;
    listStatus.textContent = "Enter the customer's name.";
    return;
  }

  button.disabled = true;
  try {
    await updateDoc(doc(db, "enquiries", enquiry.id), updates);
    listStatus.hidden = false;
    listStatus.textContent = "Quotation request updated.";
  } catch (error) {
    console.error("Could not update quotation request details.", error);
    listStatus.hidden = false;
    listStatus.textContent = displayError(error);
    button.disabled = false;
  }
}

async function removeEnquiry(enquiry, button) {
  const customerName = enquiry.name || "this customer";
  if (!window.confirm(`Delete the quotation request from ${customerName}? This cannot be undone.`)) return;

  button.disabled = true;
  try {
    await deleteDoc(doc(db, "enquiries", enquiry.id));
    listStatus.hidden = false;
    listStatus.textContent = "Quotation request deleted.";
  } catch (error) {
    console.error("Could not delete quotation request.", error);
    listStatus.hidden = false;
    listStatus.textContent = displayError(error);
    button.disabled = false;
  }
}

function renderGallery() {
  galleryAdminList.replaceChildren();

  if (galleryImages.length === 0) {
    setGalleryStatus("No gallery images yet. Add an image using the form above.");
  }

  const folders = new Map([
    ...galleryFolders.map((folder) => [folder, []]),
    [uncategorizedGalleryFolder, []],
  ]);
  galleryImages.forEach((image) => {
    const folder = folders.has(image.category) ? image.category : uncategorizedGalleryFolder;
    folders.get(folder).push(image);
  });

  folders.forEach((images, folderName) => {
    if (folderName === uncategorizedGalleryFolder) return;

    const folder = makeElement("section", "gallery-admin-folder");
    const heading = makeElement("div", "gallery-admin-folder-heading");
    heading.append(
      makeElement("h3", "", folderName),
      makeElement("span", "", `${images.length} ${images.length === 1 ? "image" : "images"}`),
    );
    const folderImages = makeElement("div", "gallery-admin-folder-images");

    images.forEach((image) => {
      const card = makeElement("article", "gallery-admin-card");
      const preview = document.createElement("img");
      preview.src = image.url;
      preview.alt = image.alt || image.title || "Gallery image";
      preview.loading = "lazy";

      const form = document.createElement("form");
      form.className = "gallery-edit-form";
      const titleLabel = makeElement("label", "", "Image title");
      const titleInput = document.createElement("input");
      titleInput.name = "title";
      titleInput.maxLength = 120;
      titleInput.required = true;
      titleInput.value = image.title || "";
      titleLabel.append(titleInput);

      const altLabel = makeElement("label", "", "Image description");
      const altInput = document.createElement("input");
      altInput.name = "alt";
      altInput.maxLength = 250;
      altInput.required = true;
      altInput.value = image.alt || "";
      altLabel.append(altInput);

      const categoryLabel = makeElement("label", "", "Gallery folder");
      const categorySelect = document.createElement("select");
      categorySelect.name = "category";
      categorySelect.required = true;
      [uncategorizedGalleryFolder, ...galleryFolders].forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        option.selected = category === (galleryFolders.includes(image.category) ? image.category : uncategorizedGalleryFolder);
        categorySelect.append(option);
      });
      categoryLabel.append(categorySelect);

      const fileLabel = makeElement("label", "", "Replace image (optional)");
      const fileInput = document.createElement("input");
      fileInput.name = "image";
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileLabel.append(fileInput);

      const actions = makeElement("div", "gallery-card-actions");
      const saveButton = makeElement("button", "button button-gold", "Save changes");
      saveButton.type = "submit";
      const deleteButton = makeElement("button", "button button-outline", "Delete");
      deleteButton.type = "button";
      actions.append(saveButton, deleteButton);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        saveGalleryImage(image, titleInput.value.trim(), altInput.value.trim(), categorySelect.value, fileInput.files[0], saveButton);
      });
      deleteButton.addEventListener("click", () => removeGalleryImage(image, deleteButton));
      form.append(titleLabel, altLabel, categoryLabel, fileLabel, actions);
      card.append(preview, form);
      folderImages.append(card);
    });

    if (images.length === 0) {
      folderImages.append(makeElement("p", "gallery-admin-folder-empty", "No images in this folder yet."));
    }
    folder.append(heading, folderImages);
    galleryAdminList.append(folder);
  });

  if (galleryImages.length > 0) galleryStatus.hidden = true;
}

function validateGalleryFile(file) {
  if (!file) return "Choose an image file.";
  if (!file.type.startsWith("image/")) return "Choose a valid image file.";
  if (file.size >= 10 * 1024 * 1024) return "Images must be smaller than 10 MB.";
  return "";
}

function getGalleryFolderName(category) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uncategorized";
}

async function uploadGalleryFile(file, imageId, category) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `gallery/${getGalleryFolderName(category)}/${imageId}/${crypto.randomUUID()}-${safeName}`;
  const imageRef = ref(storage, storagePath);
  await uploadBytes(imageRef, file, { contentType: file.type });
  try {
    return { storagePath, url: await getDownloadURL(imageRef) };
  } catch (error) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      console.error("Could not clean up the uploaded file after its URL lookup failed.", cleanupError);
    }
    throw error;
  }
}

async function moveGalleryFile(image, category) {
  const oldRef = ref(storage, image.storagePath);
  const [bytes, metadata] = await Promise.all([getBytes(oldRef), getMetadata(oldRef)]);
  if (!metadata.contentType || !metadata.contentType.startsWith("image/")) {
    throw new Error("The existing gallery file does not have a valid image content type.");
  }
  const folderName = getGalleryFolderName(category);
  const storagePath = `gallery/${folderName}/${image.id}/${crypto.randomUUID()}-${image.storagePath.split("/").pop()}`;
  const imageRef = ref(storage, storagePath);
  await uploadBytes(imageRef, bytes, { contentType: metadata.contentType });
  try {
    return { storagePath, url: await getDownloadURL(imageRef) };
  } catch (error) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      console.error("Could not clean up the moved file after its URL lookup failed.", cleanupError);
    }
    throw error;
  }
}

async function seedInitialGallery() {
  const markerRef = doc(db, "galleryMeta", "initialContent");
  await runTransaction(db, async (transaction) => {
    const marker = await transaction.get(markerRef);
    if (marker.exists() && marker.data().categorizedInitialImagesV2) return;

    const imageRefs = initialGalleryImages.map((image) => doc(db, "gallery", image.id));
    const imageSnapshots = await Promise.all(imageRefs.map((imageRef) => transaction.get(imageRef)));

    if (marker.exists()) {
      imageSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) return;
        const image = initialGalleryImages[index];
        const data = snapshot.data();
        const isInitialPlaySchoolImage = /^gallery1[1-7]$/.test(image.id);
        const shouldCategorizeUncategorizedImage = data.category === uncategorizedGalleryFolder;
        if (data.storagePath === null
          && data.url === image.src
          && galleryFolders.includes(image.category)
          && (isInitialPlaySchoolImage || shouldCategorizeUncategorizedImage)
          && data.category !== image.category) {
          transaction.update(imageRefs[index], {
            category: image.category,
            updatedAt: serverTimestamp(),
          });
        }
      });
      transaction.update(markerRef, {
        categorizedInitialImages: true,
        categorizedInitialImagesV2: true,
      });
      return;
    }

    initialGalleryImages.forEach((image, index) => {
      transaction.set(imageRefs[index], {
        title: image.alt,
        alt: image.alt,
        category: galleryFolders.includes(image.category) ? image.category : uncategorizedGalleryFolder,
        url: image.src,
        storagePath: null,
        order: index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    transaction.set(markerRef, {
      initializedAt: serverTimestamp(),
      categorizedInitialImages: true,
      categorizedInitialImagesV2: true,
    });
  });
}

function listenForGallery() {
  if (stopGalleryListening) stopGalleryListening();
  setGalleryStatus("Loading gallery…");
  stopGalleryListening = onSnapshot(
    query(collection(db, "gallery"), orderBy("order")),
    (snapshot) => {
      galleryImages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderGallery();
    },
    (error) => {
      console.error("Could not load gallery management data.", error);
      setGalleryStatus(displayError(error));
    },
  );
}

async function addGalleryImage(event) {
  event.preventDefault();
  if (!galleryForm.reportValidity()) return;

  const formData = new FormData(galleryForm);
  const title = String(formData.get("title")).trim();
  const alt = String(formData.get("alt")).trim();
  const category = String(formData.get("category"));
  const file = formData.get("image");
  const validationError = validateGalleryFile(file);
  if (validationError) {
    setGalleryStatus(validationError);
    return;
  }

  addGalleryButton.disabled = true;
  setGalleryStatus("Uploading image…");
  let uploadedImage;
  try {
    const imageRef = doc(collection(db, "gallery"));
    uploadedImage = await uploadGalleryFile(file, imageRef.id, category);
    await setDoc(imageRef, {
      title,
      alt,
      category,
      ...uploadedImage,
      order: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    galleryForm.reset();
    setGalleryStatus("Image added to the gallery.");
  } catch (error) {
    console.error("Could not add gallery image.", error);
    if (uploadedImage) {
      try {
        await deleteObject(ref(storage, uploadedImage.storagePath));
      } catch (cleanupError) {
        console.error("Could not clean up the failed gallery image upload.", cleanupError);
      }
    }
    setGalleryStatus(displayError(error));
  } finally {
    addGalleryButton.disabled = false;
  }
}

async function saveGalleryImage(image, title, alt, category, file, button) {
  if (!title || !alt) {
    setGalleryStatus("Enter both an image title and description.");
    return;
  }
  if (file) {
    const validationError = validateGalleryFile(file);
    if (validationError) {
      setGalleryStatus(validationError);
      return;
    }
  }

  button.disabled = true;
  setGalleryStatus("Saving image changes…");
  let savedFile;
  try {
    if (file) {
      savedFile = await uploadGalleryFile(file, image.id, category);
    } else if (
      image.storagePath
      && !image.storagePath.startsWith(`gallery/${getGalleryFolderName(category)}/${image.id}/`)
    ) {
      savedFile = await moveGalleryFile(image, category);
    }
    await updateDoc(doc(db, "gallery", image.id), {
      title,
      alt,
      category,
      ...(savedFile || {}),
      updatedAt: serverTimestamp(),
    });

    if (savedFile && image.storagePath) {
      try {
        await deleteObject(ref(storage, image.storagePath));
      } catch (error) {
        console.error("Image was updated, but the previous file could not be removed.", error);
        setGalleryStatus("Image updated, but the previous file could not be removed from storage.");
        return;
      }
    }
    setGalleryStatus("Gallery image updated.");
  } catch (error) {
    console.error("Could not update gallery image.", error);
    if (savedFile) {
      try {
        await deleteObject(ref(storage, savedFile.storagePath));
      } catch (cleanupError) {
        console.error("Could not clean up the failed gallery file update.", cleanupError);
      }
    }
    setGalleryStatus(displayError(error));
  } finally {
    button.disabled = false;
  }
}

async function removeGalleryImage(image, button) {
  if (!window.confirm(`Delete "${image.title || "this gallery image"}"?`)) return;
  button.disabled = true;
  setGalleryStatus("Deleting image…");
  try {
    await deleteDoc(doc(db, "gallery", image.id));
    if (image.storagePath) {
      try {
        await deleteObject(ref(storage, image.storagePath));
      } catch (error) {
        console.error("Gallery record was deleted, but its image file could not be removed.", error);
        setGalleryStatus("Gallery entry deleted, but its file could not be removed from storage.");
        return;
      }
    }
    setGalleryStatus("Gallery image deleted.");
  } catch (error) {
    console.error("Could not delete gallery image.", error);
    setGalleryStatus(displayError(error));
  } finally {
    button.disabled = false;
  }
}

async function saveStatus(enquiryId, select) {
  const previousStatus = enquiries.find((item) => item.id === enquiryId)?.status || "new";
  select.disabled = true;
  select.classList.add("is-saving");
  try {
    await updateDoc(doc(db, "enquiries", enquiryId), {
      status: select.value,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Could not update enquiry status.", error);
    select.value = previousStatus;
    listStatus.hidden = false;
    listStatus.textContent = displayError(error);
  } finally {
    select.disabled = false;
    select.classList.remove("is-saving");
  }
}

function listenForEnquiries() {
  if (stopListening) stopListening();
  listStatus.hidden = false;
  listStatus.textContent = "Loading enquiries…";
  const enquiriesQuery = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));

  stopListening = onSnapshot(enquiriesQuery, (snapshot) => {
    enquiries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    counts.total.textContent = String(enquiries.length);
    counts.new.textContent = String(enquiries.filter((item) => (item.status || "new") === "new").length);
    counts.progress.textContent = String(enquiries.filter((item) => item.status === "in-progress").length);
    counts.completed.textContent = String(enquiries.filter((item) => item.status === "completed").length);
    renderEnquiries();
  }, (error) => {
    console.error("Could not load enquiries from Firestore.", error);
    listStatus.hidden = false;
    listStatus.textContent = displayError(error);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const formData = new FormData(loginForm);
  loginButton.disabled = true;
  loginStatus.textContent = "Signing in…";
  try {
    await signInWithEmailAndPassword(
      auth,
      String(formData.get("email")).trim(),
      String(formData.get("password")),
    );
    loginForm.reset();
    loginStatus.textContent = "";
  } catch (error) {
    console.error("Admin sign-in failed.", error);
    loginStatus.textContent = displayError(error);
  } finally {
    loginButton.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Admin sign-out failed.", error);
    listStatus.hidden = false;
    listStatus.textContent = "Could not sign out. Please try again.";
  } finally {
    signOutButton.disabled = false;
  }
});

searchInput.addEventListener("input", renderEnquiries);
statusFilter.addEventListener("change", renderEnquiries);
galleryForm.addEventListener("submit", addGalleryImage);
galleryFolders.forEach((folder) => {
  const option = document.createElement("option");
  option.value = folder;
  option.textContent = folder;
  galleryCategoryInput.append(option);
});

const requestedGalleryFolder = new URLSearchParams(window.location.search).get("category");
if (galleryFolders.includes(requestedGalleryFolder)) {
  galleryCategoryInput.value = requestedGalleryFolder;
}

onAuthStateChanged(auth, (user) => {
  loginPanel.hidden = Boolean(user);
  dashboardPanel.hidden = !user;
  loginStatus.textContent = "";

  if (user) {
    listenForEnquiries();
    if (galleryFolders.includes(requestedGalleryFolder)) {
      document.getElementById("galleryManager").scrollIntoView({ block: "start" });
    }
    seedInitialGallery()
      .then(listenForGallery)
      .catch((error) => {
        console.error("Could not initialize the gallery manager.", error);
        setGalleryStatus(displayError(error));
      });
  } else {
    if (stopListening) stopListening();
    if (stopGalleryListening) stopGalleryListening();
    stopListening = null;
    stopGalleryListening = null;
    enquiries = [];
    enquiryList.replaceChildren();
    galleryImages = [];
    galleryAdminList.replaceChildren();
  }
});

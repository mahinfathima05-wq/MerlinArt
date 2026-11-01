import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { db } from "./firebase.js";

const whatsappNumber = "919886101903";
const enquiryForms = document.querySelectorAll("[data-enquiry-form]");

enquiryForms.forEach((contactForm) => {
  const formStatus = contactForm.querySelector(".form-status");
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const whatsappLink = contactForm.querySelector(".whatsapp-send-link");
  if (!formStatus || !submitButton) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const service = String(formData.get("service") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name) {
      contactForm.elements.namedItem("name").setCustomValidity("Please enter your name.");
      contactForm.reportValidity();
      contactForm.elements.namedItem("name").setCustomValidity("");
      return;
    }

    submitButton.disabled = true;
    formStatus.textContent = "Saving your enquiry…";
    if (whatsappLink) whatsappLink.hidden = true;
    const whatsappWindow = window.open("about:blank", "_blank");

    try {
      await addDoc(collection(db, "enquiries"), {
        name,
        phone,
        email,
        service,
        message,
        smsConsent: formData.get("smsConsent") === "yes",
        status: "new",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      if (whatsappWindow) whatsappWindow.close();
      console.error("Could not save the contact enquiry to Firestore.", error);
      if (error.code === "permission-denied") {
        formStatus.textContent =
          "Your enquiry wasn't saved because Firestore denied access. Please contact us by phone or WhatsApp while the site administrator checks the Firestore rules.";
      } else if (error.code === "unavailable" || error.code === "network-request-failed") {
        formStatus.textContent =
          "Your enquiry wasn't saved because the database couldn't be reached. Check your internet connection and try again, or contact us by phone or WhatsApp.";
      } else {
        formStatus.textContent =
          "We couldn't save your enquiry. Please try again or contact us by phone or WhatsApp.";
      }
      submitButton.disabled = false;
      return;
    }

    const whatsappMessage = [
      "New quotation request",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email || "Not provided"}`,
      `Service: ${service}`,
      `Project details: ${message || "Not provided"}`,
    ].join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    contactForm.reset();
    formStatus.textContent =
      "Your enquiry is saved in our admin dashboard. Review the message in WhatsApp and tap Send to share it with our team.";
    if (whatsappLink) whatsappLink.href = whatsappUrl;

    if (whatsappWindow) {
      try {
        whatsappWindow.opener = null;
        whatsappWindow.location.href = whatsappUrl;
        if (whatsappLink) whatsappLink.hidden = true;
      } catch (error) {
        console.error("Could not open WhatsApp for the saved contact enquiry.", error);
        if (whatsappLink) whatsappLink.hidden = false;
      }
    } else if (whatsappLink) {
      whatsappLink.hidden = false;
    }
    submitButton.disabled = false;
  });
});

async function start() {
  const weatherPromise = await fetch("https://api.weather.gov/gridpoints/MFL/110,50/forecast")
  const weatherData = await weatherPromise.json()

  const ourTemperature = weatherData.properties.periods[0].temperature
  document.querySelector("#temperature-output").textContent = ourTemperature

}

start()

// pet filter button code
const allButtons = document.querySelectorAll(".pet-filter button")

allButtons.forEach(el => {
  el.addEventListener("click", handleButtonClick)
})

function handleButtonClick(e) {
  // remove active class from any and all buttons
  allButtons.forEach(el => el.classList.remove("active"))

  // add active class to the specific button that just got clicked
  e.target.classList.add("active")

  // actually filter the pets down below
  const currentFilter = e.target.dataset.filter
  document.querySelectorAll(".pet-card").forEach(el => {
    if (currentFilter == el.dataset.species || currentFilter == "all") {
      el.style.display = "grid"
    } else {
      el.style.display = "none"
    }
  })
}

// contact form overlay is hidden, becomes visible on button click
document.querySelector(".form-overlay").style.display = ""

// Contact Form. Get pet data, then make visible
function openOverlay(el) {
  document.querySelector(".form-content").dataset.id = el.dataset.id;
  document.getElementById("contact-pet-name").textContent = el.closest(".pet-card").querySelector(".pet-name").textContent.trim();
  document.querySelector(".form-photo img").src = el.closest(".pet-card").querySelector(".pet-card-photo img").src;
  document.querySelector(".form-overlay").classList.add("form-overlay--is-visible");
  document.querySelector(":root").style.overflowY = "hidden";
}

// contact form overlay hidden after click on X
document.querySelector(".close-form-overlay").addEventListener("click", closeOverlay);

function closeOverlay() {
  document.querySelector(".form-overlay").classList.remove("form-overlay--is-visible");
  document.querySelector(":root").style.overflowY = ""
}

// contact form submission
document.querySelector(".form-content").addEventListener("submit", async function (e) {
  e.preventDefault();

  // gather values to populate contactObject in contactController file. petID used in multiple places.
  const userValues = {
    petId: e.target.dataset.id,
    visitorName: document.querySelector("#visitor-name").value,
    visitorEmail: document.querySelector("#visitor-email").value,
    visitorTest: document.querySelector("#visitor-test").value,
    visitorComment: document.querySelector("#visitor-comment").value,
  }

  fetch("/submit-contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userValues)
  })

  // Display confirmation msg and timeout contact form
  document.querySelector(".contact-confirm").classList.add("contact-confirm--visible")
  setTimeout(closeOverlay, 2500)
  setTimeout(() => {
    document.querySelector(".contact-confirm").classList.remove("contact-confirm--visible")
  }, 2800)

  //Reset form values to empty
  document.querySelector("#visitor-name").value = ""
  document.querySelector("#visitor-email").value = ""
  document.querySelector("#visitor-test").value = ""
  document.querySelector("#visitor-comment").value = ""
});
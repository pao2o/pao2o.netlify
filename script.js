function handleSectionClick(event) {
    const targetSection = document.querySelector(event.target.getAttribute("href"));
    const currentSection = document.querySelector("#container .fade-in");
    
    if (currentSection) {
        currentSection.classList.remove("fade-in");
        currentSection.classList.add("fade-out");

        setTimeout(() => {
            currentSection.style.visibility = "hidden";
            currentSection.classList.remove("fade-out");

            targetSection.style.visibility = "visible";
            targetSection.classList.add("fade-in");
        }, 3000); // Adjust the delay (in milliseconds) as needed
    }
}

const sidebarLinks = document.querySelectorAll("#sidebar a");

sidebarLinks.forEach(link => {
    link.addEventListener("click", handleSectionClick);
});

function handleSectionClick(event) {
    event.preventDefault(); // Prevent the default behavior of the anchor tag
  
    // Get the visualization box element
    var visualizationBox = document.getElementById('visualization-box');
  
    // Get the href of the clicked link
    var href = event.target.closest('a').getAttribute('href');
    
    var content;
    if (href === '#letf-backtest') {
        content = letfBacktest()
    } else if (href === '#jaro-winkler') {
        content = '<h2>Jaro-Winkler</h2>';
    } else {
        content = '<h2>Unknown section</h2>';
    }
  
    // Add the fade-in class to the new content
    visualizationBox.innerHTML = `
      <div>
        ${content}
      </div>
    `;
}
function letfBacktest() {
  const inputGroups = [
    {
      title: "Set Dates",
      labels: ["Start Date", "End Date"]
    },
    {
      title: "Make Adjustments",
      labels: ["Add to CAGR", "Adjusted vol / Actual vol", "Add to 3M Treasury"]
    },
    {
      title: "Set Leverage",
      labels: ["Daily Leverage", "LETF expense ratio"]
    },
    {
      title: "Actual Period Characteristics",
      labels: ["Period length", "Period CAGR", "Period Volatility", "3M Treasury avg"]
    },
    {
      title: "Adjusted Period Characteristics",
      labels: ["Adjusted CAGR", "Adjusted Volatility", "Adjusted 3M Treasury avg"]
    },
    {
      title: "LETF Results",
      labels: ["LETF CAGR", "LETF Volatility"]
    },
    {
      title: "Helpers",
      labels: ["", "", "", ""]
    }
  ];

  const createInput = (label, name) => {
    if (label === "Start Date" || label === "End Date") {
      const defaultValue = label === "Start Date" ? "1960-01-01" : "2023-04-12";
      const input = document.createElement("input");
      input.type = "date";
      input.name = name;
      input.value = defaultValue;
      input.classList.add(name);
      input.addEventListener("input", calculateAndUpdatePeriodLength); // Attach event listener
      input.addEventListener("input", calculatePeriodCAGR);

      const dateInput = document.createElement("div");
      dateInput.classList.add("date-input");
      dateInput.appendChild(input);

      const labelElement = document.createElement("label");
      labelElement.textContent = label;

      const container = document.createElement("div");
      container.appendChild(labelElement);
      container.appendChild(dateInput);
      container.appendChild(document.createElement("br"));

      return container.innerHTML;
    } else if (label === "Add to CAGR" || label === "Add to 3M Treasury") {
      const defaultValue = "0.00";
      return `
        <label>${label}:</label>
        <div class="percentage-input">
          <input type="text" name="${name}" value="${defaultValue}"><span class="percentage-symbol">%</span>
        </div><br>
      `;
    } else if (label === "Adjusted vol / Actual vol" || label === "Daily Leverage") {
      const defaultValue = label === "Adjusted vol / Actual vol" ? "1" : "3";
      return `
        <label>${label}:</label>
        <input type="number" name="${name}" value="${defaultValue}"><br>
      `;
    } else if (label === "LETF expense ratio") {
      const defaultValue = "0.91";
      return `
        <label>${label}:</label>
        <div class="percentage-input">
          <input type="text" name="${name}" value="${defaultValue}"><span class="percentage-symbol">%</span>
        </div><br>
      `;
    } else {
      return label ? `<label>${label}:</label><input type="number" name="${name}" readonly><br>` : `<input type="text" name="${name}" readonly><br>`;
    }
  };
  
  const createInputs = (labels) => {
    return labels.map(label => {
      const name = label.replace(/ /g, '_').toLowerCase();
      return createInput(label, name);
    }).join('');
  };

  const createFormGroup = (groupTitle, groupLabels) => {
    const groupInputs = createInputs(groupLabels);

    return `
      <div class="input-group">
        <div class="input-label" onclick="toggleInputContainer(this)">
          <span class="indicator">▼</span>
          ${groupTitle}
        </div>
        <div class="input-container">
          ${groupInputs}
        </div>
      </div>
    `;
  };

  const createFormContent = () => {
    const leftGroups = inputGroups.slice(3).map(group => createFormGroup(group.title, group.labels)).join('');
    const rightGroups = inputGroups.slice(0, 3).map(group => createFormGroup(group.title, group.labels)).join('');

    return `
        <h2>LETF Backtest</h2>
        <div class="input-container">
          <div class="left-inputs">
            ${leftGroups}
          </div>
          <div class="right-inputs">
            ${rightGroups}
          </div>
        </div>
    `;
  };

  return createFormContent();
}


//HELPER FUNCTIONS//


function highlightActiveLink() {
    var sectionLinks = document.querySelectorAll('.section-box a p');

    sectionLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            // Remove the active class from all links
            sectionLinks.forEach(function(otherLink) {
                otherLink.classList.remove('active');
            });
            
            // Add the active class to the clicked link
            event.target.classList.add('active');
        });
    });
}

function toggleInputContainer(label) {
  const inputContainer = label.nextElementSibling;
  const indicator = label.querySelector('.indicator');
  inputContainer.classList.toggle("collapsed");
  indicator.textContent = inputContainer.classList.contains('collapsed') ? '▼' : '▲';
}

highlightActiveLink();

// Call the function to create the form and attach event listeners when the content is loaded
document.addEventListener("DOMContentLoaded", function() {
  const visualizationBox = document.getElementById("visualization-box");
  visualizationBox.innerHTML = letfBacktest();

  // Attach event listeners to start date and end date inputs
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  startDateInput.addEventListener("input", function() {
    calculateAndUpdatePeriodLength();
    calculatePeriodCAGR();
  });
  endDateInput.addEventListener("input", function() {
    calculateAndUpdatePeriodLength();
    calculatePeriodCAGR();
  });

});
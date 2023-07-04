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
      return `
        <label>${label}:</label>
        <input type="date" name="${name}" value="${defaultValue}"><br>
      `;
    } else if (label === "Add to CAGR" || label === "Add to 3M Treasury") {
      const defaultValue = "0.00%";
      return `
        <label>${label}:</label>
        <input type="text" name="${name}" value="${defaultValue}"><br>
      `;
    } else if (label === "Adjusted vol / Actual vol") {
      const defaultValue = "1";
      return `
        <label>${label}:</label>
        <input type="text" name="${name}" value="${defaultValue}"><br>
      `;
    } else if (label === "Daily Leverage") {
      const defaultValue = "3";
      return `
        <label>${label}:</label>
        <input type="text" name="${name}" value="${defaultValue}"><br>
      `;
    } else if (label === "LETF expense ratio") {
      const defaultValue = "0.91%";
      return `
        <label>${label}:</label>
        <input type="text" name="${name}" value="${defaultValue}"><br>
      `;
    } else {
      return label ? `<label>${label}:</label><input type="text" name="${name}"><br>` : `<input type="text" name="${name}"><br>`;
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

function formatPercentage(event) {
    const input = event.target;
    let value = input.value;
    value = value.replace('%', '');
    if (!isNaN(value)) {
        const decimalValue = parseFloat(value) / 100;
        input.value = value + '%';
        console.log(decimalValue);
    } else {
        input.value = value;
        console.log('Invalid input');
    }
}

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
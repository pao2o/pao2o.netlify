function handleSectionClick(event) {
  event.preventDefault(); // Prevent the default behavior of the anchor tag

  // Get the visualization box element
  var visualizationBox = document.getElementById("visualization-box");

  // Get the href of the clicked link
  var href = event.target.closest("a").getAttribute("href");

  var content;
  if (href === "#letf-backtest") {
    content = letfBacktest();

    // Clear the visualization box
    visualizationBox.innerHTML = "";

    // Append the content container to the visualization box
    visualizationBox.appendChild(content);

    // Call the function to attach event listeners and perform calculations when the content is loaded
    attachLETFBacktestEventListeners();
  } else if (href === "#jaro-winkler") {
    content = "<h2>Jaro-Winkler</h2>";

    // Add the content to the visualization box
    visualizationBox.innerHTML = `
      <div>
        ${content}
      </div>
    `;
  } else {
    content = "<h2>Unknown section</h2>";

    // Add the content to the visualization box
    visualizationBox.innerHTML = `
      <div>
        ${content}
      </div>
    `;
  }
}




function letfBacktest() {
  const inputGroups = [
    {
      title: "Set Dates",
      labels: ["Start Date", "End Date"],
    },
    {
      title: "Make Adjustments",
      labels: [
        "Add to CAGR",
        "Adjusted vol / Actual vol",
        "Add to 3M Treasury",
      ],
    },
    {
      title: "Set Leverage",
      labels: ["Daily Leverage", "LETF expense ratio"],
    },
    {
      title: "Actual Period Characteristics",
      labels: [
        "Period length",
        "Period CAGR",
        "Period Volatility",
        "3M Treasury avg",
      ],
    },
    {
      title: "Adjusted Period Characteristics",
      labels: [
        "Adjusted CAGR",
        "Adjusted Volatility",
        "Adjusted 3M Treasury avg",
      ],
    },
    {
      title: "LETF Results",
      labels: ["LETF CAGR", "LETF Volatility"],
    },
    {
      title: "Helpers",
      labels: ["helper1", "helper2", "helper3", "helper4"],
    },
  ];

  const createInput = (label, name) => {
    const percentageFields = [
      "Period CAGR",
      "Period Volatility",
      "3M Treasury avg",
      "Adjusted CAGR",
      "Adjusted Volatility",
      "Adjusted 3M Treasury avg",
      "LETF CAGR",
      "LETF Volatility",
    ];

    if (label === "Start Date" || label === "End Date") {
      const defaultValue = label === "Start Date" ? "1928-01-03" : "2023-04-12";
      const input = document.createElement("input");
      input.type = "date";
      input.name = name;
      input.valueAsDate = new Date(defaultValue);
      input.classList.add(name);
      input.addEventListener("input", queryData);
      input.addEventListener("input", calculateChartData);

      // Format the date value as yyyy-mm-dd
      const formattedValue = input.valueAsDate.toISOString().split("T")[0];
      input.setAttribute("value", formattedValue);

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
    } else if (label === "Period length") {
      const input = document.createElement("input");
      input.type = "number";
      input.name = name;
    
      const labelElement = document.createElement("label");
      labelElement.textContent = label;
    
      const container = document.createElement("div");
      container.appendChild(labelElement);
      container.appendChild(input);
      container.appendChild(document.createElement("br"));
    
      return container.innerHTML;
    }else if (label === "Daily Leverage") {
      const defaultValue = "3";
      const input = document.createElement("input");
      input.type = "number";
      input.name = name;
      input.defaultValue = defaultValue; // Corrected attribute name to set the default value
      input.addEventListener("input", function () {
        calculateLETFVolatility();
      });
    
      const labelElement = document.createElement("label");
      labelElement.textContent = label;
    
      const container = document.createElement("div");
      container.appendChild(labelElement);
      container.appendChild(input);
      container.appendChild(document.createElement("br"));
    
      return container.innerHTML;
    } else if (percentageFields.includes(label)) {
      return `
        <label>${label}:</label>
        <div class="percentage-input">
          <input type="text" name="${name}" value=""><span class="percentage-symbol">%</span>
        </div><br>
      `;
    } else if (label === "Add to CAGR" || label === "Add to 3M Treasury") {
      const defaultValue = "0.00";
      return `
        <label>${label}:</label>
        <div class="percentage-input">
          <input type="text" name="${name}" value="${defaultValue}"><span class="percentage-symbol">%</span>
        </div><br>
      `;
    } else if (label === "Adjusted vol / Actual vol") {
      const defaultValue = "1";
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
      const input = document.createElement("input");
      input.type = "text";
      input.name = name;


      const container = document.createElement("div");
      container.appendChild(input);
      container.appendChild(document.createElement("br"));

      return container.innerHTML;
    }
  };

  const createInputs = (labels) => {
    return labels
      .map((label) => {
        const name = label.replace(/ /g, "_").toLowerCase();
        return createInput(label, name);
      })
      .join("");
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
    const leftGroups = inputGroups
      .slice(3)
      .map((group) => createFormGroup(group.title, group.labels))
      .join("");
    const rightGroups = inputGroups
      .slice(0, 3)
      .map((group) => createFormGroup(group.title, group.labels))
      .join("");

    const formContent = `
      <h2>LETF Backtest</h2>
      <div class="container">
        <div class="input-container">
          <div class="left-inputs">
            ${leftGroups}
          </div>
          <div class="right-inputs">
            ${rightGroups}
          </div>
        </div>
        <div class="chart-container">
          <canvas id="chartContainer"></canvas>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = formContent;


    return container; // Return the container element
  };

  return createFormContent();
}


//HELPER FUNCTIONS//

function highlightActiveLink() {
  var sectionLinks = document.querySelectorAll(".section-box a p");

  sectionLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      // Remove the active class from all links
      sectionLinks.forEach(function (otherLink) {
        otherLink.classList.remove("active");
      });

      // Add the active class to the clicked link
      event.target.classList.add("active");
    });
  });
}

function toggleInputContainer(label) {
  const inputContainer = label.nextElementSibling;
  const indicator = label.querySelector(".indicator");
  inputContainer.classList.toggle("collapsed");
  indicator.textContent = inputContainer.classList.contains("collapsed")
    ? "▼"
    : "▲";
}

highlightActiveLink();

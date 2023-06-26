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
    var leftLabels = [
        "Period length", "Period CAGR", "Period Volatility", "3M Treasury avg",
        "Adjusted CAGR", "Adjusted Volatility", "Adjusted 3M Treasury avg",
        "LETF CAGR", "LETF Volatility"
    ];
    var rightLabels = [
        "Start Date", "End Date", "Add to CAGR", "Adjusted vol / Actual vol",
        "Add to 3M Treasury", "Daily Leverage", "LETF expense ratio", "Helpers", 
        "helpers_extra", "helpers_extra", "helpers_extra"
    ];
    const createInput = (label, name) => {
        let input = '';
        if (label !== "helpers_extra") {
          input += `<label>${label}:</label><br>`;
        }
        if (label === "Add to CAGR") {
          input += `<input type="text" name="${name}" pattern="\\d+(\\.\\d+)?(%|%)?" title="Enter a percentage value (e.g., 10%)" required oninput="formatPercentage(event)" value="0.00%"><br>`;
        } else if (label === "Start Date") {
          input += `<input type="date" name="${name}" value="1928-01-03"><br>`;
        } else if (label === "Add to 3M Treasury") {
          input += `<input type="text" name="${name}" value="0.00%"><br>`;
        } else if (label === "LETF expense ratio") {
          input += `<input type="text" name="${name}" pattern="\\d+(\\.\\d+)?(%|%)?" title="Enter a percentage value (e.g., 10%)" required oninput="formatPercentage(event)" value="0.91%"><br>`;
        } else if (label === "Adjusted vol / Actual vol") {
          input += `<input type="text" name="${name}" value="1"><br>`;
        } else if (label === "Daily Leverage") {
          input += `<input type="text" name="${name}" value="3"><br>`;
        } else {
          input += `<input type="text" name="${name}"><br>`;
        }
        return input;
      };
      
    const createInputs = (labels) => {
        let inputs = '';
        labels.forEach(label => {
            const name = label.replace(/ /g, '_').toLowerCase();
            inputs += createInput(label, name);
        });
        return inputs;
    };

    const content = `
        <div style="display: flex; flex-direction: column;">
            <h2>LETF Backtest</h2>
            <div class="input-container">
                <div class="left-inputs">
                    ${createInputs(leftLabels)}
                </div>
                <div class="right-inputs">
                    ${createInputs(rightLabels)}
                </div>
            </div>
        </div>
    `;

    return content;
}

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

highlightActiveLink();
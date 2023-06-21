{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>\n<html>\n<head>\n    <title>Personal Resume</title>\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"styles.css\">\n</head>\n<body>\n    <div id=\"sidebar\">\n        <h2>About Me</h2>\n        <p>Some information about me.</p>\n        <h2>Skills</h2>\n        <p>My skills.</p>\n        <h2>Experience</h2>\n        <p>My work experience.</p>\n        <h2>Contact</h2>\n        <p>My contact information.</p>\n    </div>\n    <div id=\"main\">\n        <!-- Main content goes here -->\n    </div>\n    <script src=\"script.js\"></script>\n</body>\n</html>"
    },
    {
      "path": "styles.css",
      "content": "body {\n    margin: 0;\n    padding: 0;\n    font-family: Arial, sans-serif;\n}\n\n#sidebar {\n    position: fixed;\n    width: 0;\n    height: 100%;\n    background-color: #333;\n    overflow-x: hidden;\n    transition: 0.5s;\n    padding: 20px;\n    color: #fff;\n}\n\n#sidebar:hover {\n    width: 250px;\n}\n\n#main {\n    margin-left: 250px;\n    padding: 20px;\

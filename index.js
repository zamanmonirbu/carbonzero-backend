const app = require("./src/app");
const { serverPort } = require("./src/config");



const PORT = serverPort || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

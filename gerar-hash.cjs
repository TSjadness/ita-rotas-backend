const bcrypt = require("bcryptjs");

(async () => {
  const hash = await bcrypt.hash("@itarota792026", 10);
  console.log(hash);
})();
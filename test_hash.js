const bcrypt = require('bcrypt');

async function test() {
  const isMatch = await bcrypt.compare("Admin@1221", "$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u");
  console.log("Match:", isMatch);
}
test();

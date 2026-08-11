import app from "./app.js";
import { env } from "./config/env.js";

app.listen(Number(env.PORT), () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});

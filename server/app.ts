import express from "express";

const app: express.Application = express();

// Anything to do with the express app server of panoptyk
// Mostly includes creating paths to certain html/js client files

app.use("/", express.static(process.cwd() + "/dist"));
app.use("/assets", express.static(process.cwd() + "/dist/assets"));

// app.get("/test", function(req, res) {
//   res.sendFile(process.cwd() + "/public/test.html");
// });

app.get("/game", function(req, res) {
  res.sendFile(process.cwd() + "/dist/index.html");
});

export default app;
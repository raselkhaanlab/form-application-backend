const router = require('express').Router();

router
.get("/",(_, res)=> res.json("get images"));
router
.post("/",(_, res)=> res.json("upload images"));

module.exports = router;
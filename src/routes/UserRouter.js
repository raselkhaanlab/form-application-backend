const router = require('express').Router();

router.route("/login")
.post((_, res)=> res.json("login router"));

module.exports = router;
const router = require('express').Router();


router.route("/create").post((_, res)=>res.json("form create"));
router.route("/forms").get((_, res)=>res.json("forms get"));
router.route("/form/:formId").get((_, res)=>res.json("form by id"));
router.route("/deleteform/:formId/:userId").delete((_, res)=>res.json("delete from by id get"));
router.route("/editform").put((_, res)=>res.json("edit from"));
router.route("/getuserforms/:userId").get((_, res)=>res.json("get from by user"));

router.route("/addresponse").post((_, res)=>res.json("add response"));
router.route("/responses").get((_, res)=>res.json("all responses"));

router.route("/getresponse/:formId").get((_, res)=>res.json("get response by form id"));



module.exports = router;
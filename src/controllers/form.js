const formService = require("../services/FormService");
const userService = require("../services/UserService");
const {ApiError} = require("../utils/ApiError");

module.exports = {
    formsGet : async(req,res)=>{
        const forms = await formService.getAllForms();
        return res.status(200).json(forms);    
    },

    createForm: async(req,res)=>{     

        const formData = {
        createdBy : req.body.createdBy,
        name: req.body.name,
        description: req.body.description
        }

        const form = await formService.createForm(formData);
        return res.status(201).json(form);
    },

    getFormById: async(req, res)=>{
            var formId = req.params.formId;
            const form = await formService.getFormById(formId);
            if(!form) {
                throw new ApiError(404, "Form not found");
            }
            return res.status(200).json(form);
    },
    
    deleteForm: async(req, res)=> {
            const formId = req.params.formId;
            const userId = req.params.userId;
          
            const form = await formService.getFormById(formId);

            if(form != null && form.createdBy == userId) {
                await formService.deleteFormById(formId);
                return res.status(200).json(null);
            }
            
            return res.status(400).json(null);
    },

    editForm : async(req, res)=>{
            var  formId =  req.body.formId;
            var data = {
                name: req.body.name,
                description: req.body.description,
                questions: req.body.questions
            }

            await formService.updateFormById(formId, data);
            return res.status(200).json(data);
           
    },

    getAllFormsOfUser: async(req, res)=>{
        const userId = req.params.userId;
        const user = await userService.getUserById(userId);
        if(!user) {
            throw new ApiError(403);
        }
        if(!Array.isArray(createdForms)) {
            return res.status(200).json([]);
        }
        const forms = formService.getFormsByIds(user.createdForms);
        return res.status(200).json(forms);   
    },

    submitResponse : async(req, res)=> {
            const formId = req.body.formId;
            const data = {
                userId: req.body.userId,
                response: req.body.response
            };
            const formResponse = await formService.saveFormResponse(formId, data);
            return res.status(200).json(formResponse)
    },

    allResponses : async(req,res)=>{
        const responses = await formService.getAllFormResponses();
        return res.status(200).json(responses);
    },

    getResponse: async(req, res)=>{
        const responses = await formService.getFromResponsesByFormId();
        return res.status(200).json(responses);
    }
}
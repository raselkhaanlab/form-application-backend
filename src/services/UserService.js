const UserModel = require('../model/User')
const jwt = require('jsonwebtoken');

module.exports = {
    loginGet : async(req,res)=>{
        try{
            const result = await UserModel.find().lean();
            res.send(result);     
        }catch(e){
            res.send(e);
        }
    },

    login: async(req,res)=>{   
        console.log(req.body.email);
        try {
            const result = await UserModel.findOne({email:req.body.email}).lean()
               // console.log(result);
                
                if(!result){
                    const gData = {
                        name: req.body.name,
                        email: req.body.email,
                        image: req.body.image
                    }
                    console.log(gData);
                    
                    const newUser = new UserModel(gData)
                    newUser.save().then((docs)=>{                        
                        const user = { 
                                   id: docs._id, 
                                   name: docs.name,  
                                   email: docs.email,
                                   image: docs.image
                                 }
                                 console.log(user);
                                 
                       const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'});
                      // console.log(accessToken);
                       
                       res.status(200).json({
                           accessToken
                       });
                    })
                } else {        
                        const user = { 
                            id: result._id, 
                            name: result.name,  
                            email: result.email,
                            image: result.image
                          }
                         // console.log(user);
                          
                        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'});
                       // console.log(accessToken);
                        res.status(200).json({
                            accessToken
                        });   
                }  
           
        } catch (error) {
            res.send(error)
        }
    }

}
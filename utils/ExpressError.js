class ExpressError extends Error{
    constructor(statusCode,message){
        super();
        this.statusCode=statusCode;
        this.message=message;
    }
}
module.exports=ExpressError;
// class ExpressError extends Error {
//     constructor(message, statusCode) {
//         super();
//         this.message = message;
//         this.statusCode = statusCode || 500;
//     }
// }

// module.exports = ExpressError;

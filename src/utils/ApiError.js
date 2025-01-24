class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
        //The stack property provides a detailed trace of where an error occurred, showing the sequence of function calls leading up to the error.
        // This helps developers trace the origin of bugs or issues in the code
        
    ){
        //Super is used to overwrite the constructore
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false,
        this.errors=errors

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
         Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}

// Version 1: The normal function
// const asyncHandler = () => {};
// This is a simple function 

// Version 2: The higher-order function
// const asyncHandler = (func) => {
//   return () => {};
// };
// Takes a function (func) as an argument.
// Returns a new function.

// Version 3: The higher-order async function
// const asyncHandler = (func) => {
//   return async () => {};
// };
// Same as above, but the returned function is asynchronous (async).
// Used when the inner function (func) involves asynchronous operations.


// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }


export {asyncHandler}
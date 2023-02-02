module.exports =  {
    successResponse : successResponse,
    failureResponse : failureResponse
}

function successResponse(data, message){
    var result={
        "status" : "success",
        "data" : data,
        "message" : message
    };
    return result;
}

function failureResponse(message){
    var result={
        "status" : "failure",
        "message" : message
    };
    return result;
}
class ApiResponse{
    constructor(statusCode,data,message="suceess"){
       this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
        this.errors = errors
    }
}
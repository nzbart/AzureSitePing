<%@ WebHandler Language="C#" Class="Handler" %>

using System.Web;

public class Handler : IHttpHandler {
    
    public void ProcessRequest (HttpContext context)
    {
        var callback = context.Request.Params["callback"];
        context.Response.ContentType = "application/json";
        context.Response.Write(callback + "([{}])");
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}
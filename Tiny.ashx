<%@ WebHandler Language="C#" Class="Handler" %>

using System.Web;

public class Handler : IHttpHandler {
    
    public void ProcessRequest (HttpContext context)
    {
	context.Response.Clear();
	context.Response.AppendHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
	context.Response.AppendHeader("Pragma", "no-cache"); 
	context.Response.AppendHeader("Expires", "0"); 

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
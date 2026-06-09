using System.Collections.Generic;

namespace CivicAlert.API.Responses.AI
{
    public class ChatResult
    {
        public string Answer { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new List<string>();
    }
}

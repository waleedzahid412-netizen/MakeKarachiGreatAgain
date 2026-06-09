namespace CivicAlert.API.Responses.AI
{
    public class ModerationResult
    {
        public bool IsAppropriate { get; set; }
        public string? Reason { get; set; }
        public double Confidence { get; set; }
    }
}

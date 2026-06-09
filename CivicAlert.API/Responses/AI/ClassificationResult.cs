namespace CivicAlert.API.Responses.AI
{
    public class ClassificationResult
    {
        public string Department { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
    }
}

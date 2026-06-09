namespace CivicAlert.API.Responses.Reports
{
    public class VerifyReportResult
    {
        public bool Success { get; set; }
        public int ConfirmCount { get; set; }
        public string NewStatus { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }
}

namespace CivicAlert.API.Responses.Auth
{
    public class AuthResponse
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public int? UserId { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public int? DistrictId { get; set; }
        public int? TownId { get; set; }
        public string? FullName { get; set; }
        public string? PreferredLanguage { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? DepartmentFullName { get; set; }
        public string? DepartmentDescription { get; set; }
    }
}

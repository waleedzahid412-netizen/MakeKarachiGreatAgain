namespace CivicAlert.API.Configuration
{
    public class JwtSettings
    {
        public string Key { get; set; } = string.Empty;
        public int ExpiryInMinutes { get; set; }
    }
}

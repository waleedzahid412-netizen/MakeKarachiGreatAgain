using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using CivicAlert.API.Data;
using CivicAlert.API.Models;
using CivicAlert.API.Configuration;
using CivicAlert.API.Repositories.Interfaces;
using CivicAlert.API.Repositories.Implementations;
using CivicAlert.API.Services.Interfaces;
using CivicAlert.API.Services.Implementations;
using CivicAlert.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. SERVICE REGISTRATION (BUILDER PHASE)
// ==========================================

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// JWT Configuration & Authentication
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["jwt_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                if (context.Exception is
                    Microsoft.IdentityModel.Tokens.SecurityTokenExpiredException)
                {
                    context.Response.Cookies.Delete("jwt_token");
                    context.Response.Headers.Append("X-Auth-Expired", "true");
                }
                return Task.CompletedTask;
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings!.Key))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Dependency Injection
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IVerificationRepository, VerificationRepository>();
builder.Services.AddScoped<IVerificationService, VerificationService>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddHttpClient<IAIService, AIService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["AIService:BaseUrl"]!);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// ==========================================
// 2. APPLICATION BUILDING
// ==========================================
var app = builder.Build();

// ==========================================
// 3. PIPELINE & MIDDLEWARE CONFIGURATION
// ==========================================

app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ==========================================
// 4. DATABASE SEEDING
// ==========================================

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Admin123!");

    // ?? DISTRICTS ??????????????????????????????????????????
    if (!await context.Districts.AnyAsync())
    {
        var districts = new List<District>
        {
            new District { NameEn = "Karachi Central", NameUr = "????? ?????", Code = "KHI-C" },
            new District { NameEn = "Karachi East",    NameUr = "????? ?????",  Code = "KHI-E" },
            new District { NameEn = "Karachi West",    NameUr = "????? ?????",  Code = "KHI-W" },
            new District { NameEn = "Karachi South",   NameUr = "????? ?????",  Code = "KHI-S" },
            new District { NameEn = "Korangi",         NameUr = "??????",       Code = "KHI-KO" },
            new District { NameEn = "Malir",           NameUr = "????",         Code = "KHI-ML" },
            new District { NameEn = "Kemari",          NameUr = "??????",       Code = "KHI-KM" },
        };
        await context.Districts.AddRangeAsync(districts);
        await context.SaveChangesAsync();
    }

    // ?? TOWNS ??????????????????????????????????????????????
    if (!await context.Towns.AnyAsync())
    {
        var districtMap = await context.Districts.ToDictionaryAsync(d => d.NameEn, d => d.Id);

        var towns = new List<Town>
        {
            // Karachi Central
            new Town { NameEn = "Gulberg Town",         NameUr = "????? ????",          DistrictId = districtMap["Karachi Central"] },
            new Town { NameEn = "Liaquatabad Town",     NameUr = "????? ???? ????",      DistrictId = districtMap["Karachi Central"] },
            new Town { NameEn = "Nazimabad Town",       NameUr = "???? ???? ????",       DistrictId = districtMap["Karachi Central"] },
            new Town { NameEn = "North Nazimabad Town", NameUr = "????? ???? ???? ????",  DistrictId = districtMap["Karachi Central"] },
            new Town { NameEn = "New Karachi Town",     NameUr = "??? ????? ????",       DistrictId = districtMap["Karachi Central"] },

            // Karachi East
            new Town { NameEn = "Gulshan-e-Iqbal Town", NameUr = "???? ????? ????",      DistrictId = districtMap["Karachi East"] },
            new Town { NameEn = "Jamshed Town",         NameUr = "????? ????",          DistrictId = districtMap["Karachi East"] },
            new Town { NameEn = "Ferozabad",            NameUr = "????? ????",           DistrictId = districtMap["Karachi East"] },
            new Town { NameEn = "Gulistan-e-Jauhar",    NameUr = "?????? ????",          DistrictId = districtMap["Karachi East"] },

            // Karachi West
            new Town { NameEn = "Orangi Town",          NameUr = "?????? ????",         DistrictId = districtMap["Karachi West"] },
            new Town { NameEn = "SITE Town",            NameUr = "???? ????",           DistrictId = districtMap["Karachi West"] },
            new Town { NameEn = "Baldia Town",          NameUr = "????? ????",          DistrictId = districtMap["Karachi West"] },
            new Town { NameEn = "Mominabad",            NameUr = "???? ????",            DistrictId = districtMap["Karachi West"] },

            // Karachi South
            new Town { NameEn = "Saddar Town",          NameUr = "??? ????",            DistrictId = districtMap["Karachi South"] },
            new Town { NameEn = "Lyari Town",           NameUr = "????? ????",           DistrictId = districtMap["Karachi South"] },
            new Town { NameEn = "Clifton",              NameUr = "?????",              DistrictId = districtMap["Karachi South"] },
            new Town { NameEn = "Defence (DHA)",        NameUr = "?????",              DistrictId = districtMap["Karachi South"] },

            // Korangi
            new Town { NameEn = "Korangi Town",         NameUr = "?????? ????",         DistrictId = districtMap["Korangi"] },
            new Town { NameEn = "Landhi Town",          NameUr = "?????? ????",          DistrictId = districtMap["Korangi"] },
            new Town { NameEn = "Shah Faisal Town",     NameUr = "??? ???? ????",       DistrictId = districtMap["Korangi"] },
            new Town { NameEn = "Model Colony",         NameUr = "???? ??????",          DistrictId = districtMap["Korangi"] },

            // Malir
            new Town { NameEn = "Malir Town",           NameUr = "???? ????",           DistrictId = districtMap["Malir"] },
            new Town { NameEn = "Bin Qasim Town",       NameUr = "?? ???? ????",        DistrictId = districtMap["Malir"] },
            new Town { NameEn = "Gadap Town",           NameUr = "???? ????",           DistrictId = districtMap["Malir"] },
            new Town { NameEn = "Airport",              NameUr = "????????",            DistrictId = districtMap["Malir"] },

            // Kemari
            new Town { NameEn = "Kemari Town",          NameUr = "?????? ????",          DistrictId = districtMap["Kemari"] },
            new Town { NameEn = "Harbour",              NameUr = "?????",              DistrictId = districtMap["Kemari"] },
            new Town { NameEn = "Mauripur",             NameUr = "???? ???",            DistrictId = districtMap["Kemari"] },
        };
        await context.Towns.AddRangeAsync(towns);
        await context.SaveChangesAsync();
    }

    // ?? CATEGORIES ?????????????????????????????????????????
    if (!await context.Categories.AnyAsync())
    {
        var categories = new List<Category>
        {
            new Category { NameEn = "Pothole / Road Damage",  NameUr = "???? / ??? ?? ?????",     Domain = "CivicInfrastructure", IconClass = "road",          DefaultPriority = 4 },
            new Category { NameEn = "Garbage Overflow",       NameUr = "???? ?? ?????",           Domain = "CivicInfrastructure", IconClass = "trash",         DefaultPriority = 3 },
            new Category { NameEn = "Water Shortage",         NameUr = "???? ?? ???",             Domain = "Utilities",           IconClass = "droplet",       DefaultPriority = 5 },
            new Category { NameEn = "Sewerage Leak",          NameUr = "?????? ?? ????",           Domain = "CivicInfrastructure", IconClass = "waves",         DefaultPriority = 5 },
            new Category { NameEn = "Broken Streetlight",     NameUr = "???? ???? ????? ????",     Domain = "CivicInfrastructure", IconClass = "lightbulb-off", DefaultPriority = 2 },
            new Category { NameEn = "Unsafe Zone",            NameUr = "??? ????? ?????",          Domain = "PublicSafety",        IconClass = "shield-alert",  DefaultPriority = 4 },
            new Category { NameEn = "Electricity Issue",      NameUr = "???? ?? ?????",            Domain = "Utilities",           IconClass = "zap",           DefaultPriority = 4 },
            new Category { NameEn = "Traffic Issue",          NameUr = "????? ?? ?????",           Domain = "PublicSafety",        IconClass = "traffic-cone",  DefaultPriority = 3 },
            new Category { NameEn = "Park Maintenance",       NameUr = "???? ?? ???? ????",        Domain = "CivicInfrastructure", IconClass = "trees",         DefaultPriority = 1 },
            new Category { NameEn = "Flooding / Drainage",    NameUr = "????? / ????? ??",         Domain = "CivicInfrastructure", IconClass = "cloud-rain",    DefaultPriority = 5 },
            new Category { NameEn = "Harassment / Safety",    NameUr = "??????? / ????",           Domain = "PublicSafety",        IconClass = "alert-triangle",DefaultPriority = 5 },
            new Category { NameEn = "General Complaint",      NameUr = "??? ?????",               Domain = "CivicInfrastructure", IconClass = "message-circle",DefaultPriority = 2 },
        };
        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
    }

    // ?? DEPARTMENTS ????????????????????????????????????????
    if (!await context.Departments.AnyAsync())
    {
        var departments = new List<Department>
        {
            new Department { Name = "KWSB",           FullName = "Karachi Water & Sewerage Board",        Description = "Water supply, sewerage, drainage, water tankers",          ContactInfo = "021-99231218", IsActive = true },
            new Department { Name = "SSWMB",          FullName = "Sindh Solid Waste Management Board",    Description = "Garbage collection, waste overflow, street cleaning",      ContactInfo = "021-99333581", IsActive = true },
            new Department { Name = "KMC-Roads",      FullName = "KMC Roads Department",                  Description = "Potholes, road damage, footpaths, street lights",          ContactInfo = "1339",         IsActive = true },
            new Department { Name = "K-Electric",     FullName = "K-Electric",                            Description = "Load shedding, power outages, exposed wires, transformers",ContactInfo = "118",          IsActive = true },
            new Department { Name = "KMC-Parks",      FullName = "KMC Parks Department",                  Description = "Parks, recreational spaces, public gardens",               ContactInfo = "021-99215117", IsActive = true },
            new Department { Name = "Traffic-Police",  FullName = "Karachi Traffic Police",                Description = "Traffic signals, congestion, violations",                  ContactInfo = "915",          IsActive = true },
            new Department { Name = "Sindh-Police",    FullName = "Sindh Police",                          Description = "Safety, harassment, theft, unsafe zones",                  ContactInfo = "15",           IsActive = true },
            new Department { Name = "NDMA",           FullName = "National Disaster Management Authority", Description = "Flooding, heatwave, disaster alerts",                      ContactInfo = "1110",         IsActive = true },
            new Department { Name = "KMC-General",    FullName = "KMC General Services",                  Description = "Other civic issues not covered above",                     ContactInfo = "1339",         IsActive = true },
        };
        await context.Departments.AddRangeAsync(departments);
        await context.SaveChangesAsync();
    }

    // ?? ADMIN USERS ????????????????????????????????????????

    // SuperAdmin
    if (!await context.Users.AnyAsync(u => u.Email == "superadmin@civicalert.pk"))
    {
        await context.Users.AddAsync(new Users
        {
            FullName = "System Administrator",
            Email = "superadmin@civicalert.pk",
            PasswordHash = hashedPassword,
            Role = "SuperAdmin",
            PhoneNumber = "0300-0000001",
            IsActive = true,
            PreferredLanguage = "en",
            CreatedAt = DateTime.UtcNow
        });
    }

    // District Admin — Karachi South
    var karachiSouth = await context.Districts.FirstOrDefaultAsync(d => d.NameEn == "Karachi South");
    if (karachiSouth != null && !await context.Users.AnyAsync(u => u.Email == "districtadmin@civicalert.pk"))
    {
        await context.Users.AddAsync(new Users
        {
            FullName = "Karachi South Admin",
            Email = "districtadmin@civicalert.pk",
            PasswordHash = hashedPassword,
            Role = "DistrictAdmin",
            DistrictId = karachiSouth.Id,
            PhoneNumber = "0300-0000002",
            IsActive = true,
            PreferredLanguage = "en",
            CreatedAt = DateTime.UtcNow
        });
    }

    // Town Admin — Saddar Town
    var saddar = await context.Towns.FirstOrDefaultAsync(t => t.NameEn == "Saddar Town");
    if (saddar != null && !await context.Users.AnyAsync(u => u.Email == "townadmin@civicalert.pk"))
    {
        await context.Users.AddAsync(new Users
        {
            FullName = "Saddar Town Admin",
            Email = "townadmin@civicalert.pk",
            PasswordHash = hashedPassword,
            Role = "TownAdmin",
            DistrictId = karachiSouth?.Id,
            TownId = saddar.Id,
            PhoneNumber = "0300-0000003",
            IsActive = true,
            PreferredLanguage = "en",
            CreatedAt = DateTime.UtcNow
        });
    }

    // Department Admins — one per department
    var deptAdmins = new[]
    {
        ("KWSB",           "kwsb@civicalert.pk",      "KWSB Admin",            "0300-0000004"),
        ("SSWMB",          "sswmb@civicalert.pk",     "SSWMB Admin",           "0300-0000005"),
        ("K-Electric",     "kelectric@civicalert.pk",  "K-Electric Admin",      "0300-0000006"),
        ("KMC-Roads",      "kmcroads@civicalert.pk",   "KMC Roads Admin",       "0300-0000007"),
        ("Traffic-Police",  "traffic@civicalert.pk",    "Traffic Police Admin",   "0300-0000008"),
        ("Sindh-Police",    "police@civicalert.pk",     "Sindh Police Admin",     "0300-0000009"),
        ("NDMA",           "ndma@civicalert.pk",       "NDMA Admin",            "0300-0000010"),
        ("KMC-Parks",      "parks@civicalert.pk",      "KMC Parks Admin",       "0300-0000011"),
        ("KMC-General",    "general@civicalert.pk",    "KMC General Admin",     "0300-0000012"),
    };

    foreach (var (deptName, email, fullName, phone) in deptAdmins)
    {
        var dept = await context.Departments.FirstOrDefaultAsync(d => d.Name == deptName);
        if (dept != null && !await context.Users.AnyAsync(u => u.Email == email))
        {
            await context.Users.AddAsync(new Users
            {
                FullName = fullName,
                Email = email,
                PasswordHash = hashedPassword,
                Role = "DepartmentAdmin",
                DepartmentId = dept.Id,
                PhoneNumber = phone,
                IsActive = true,
                PreferredLanguage = "en",
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    await context.SaveChangesAsync();
    Console.WriteLine("Database seeded successfully.");
}

// ==========================================
// 5. RUN
// ==========================================
app.Run();
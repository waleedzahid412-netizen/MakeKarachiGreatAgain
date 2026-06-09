using CivicAlert.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace CivicAlert.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<District> Districts { get; set; }
        public DbSet<Town> Towns { get; set; }
        public DbSet<Users> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<ReportVerification> ReportVerifications { get; set; }
        public DbSet<StatusHistory> StatusHistories { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<EmergencyEscalation> EmergencyEscalations { get; set; }
        public DbSet<RateLimit> RateLimits { get; set; }
        public DbSet<Department> Departments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // -----------------------------------------------
            // District -> Towns (one district has many towns)
            // -----------------------------------------------
            modelBuilder.Entity<Town>(entity =>
            {
                entity.HasOne(t => t.District)
                      .WithMany(d => d.Towns)
                      .HasForeignKey(t => t.DistrictId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // Users: scoped to District and/or Town
            // Both FK are nullable (Citizen has neither)
            // -----------------------------------------------
            modelBuilder.Entity<Users>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();

                entity.HasOne(u => u.District)
                      .WithMany(d => d.Users)
                      .HasForeignKey(u => u.DistrictId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.Town)
                      .WithMany(t => t.Users)
                      .HasForeignKey(u => u.TownId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.Department)
                      .WithMany()
                      .HasForeignKey(u => u.DepartmentId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // Reports: belongs to User, Category, District, Town
            // -----------------------------------------------
            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasOne(r => r.User)
                      .WithMany(u => u.Reports)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Category)
                      .WithMany(c => c.Reports)
                      .HasForeignKey(r => r.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.District)
                      .WithMany(d => d.Reports)
                      .HasForeignKey(r => r.DistrictId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Town)
                      .WithMany(t => t.Reports)
                      .HasForeignKey(r => r.TownId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Department)
                      .WithMany(d => d.Reports)
                      .HasForeignKey(r => r.DepartmentId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // ReportVerifications: one vote per user per report
            // -----------------------------------------------
            modelBuilder.Entity<ReportVerification>(entity =>
            {
                entity.HasIndex(v => new { v.ReportId, v.UserId }).IsUnique();

                entity.HasOne(v => v.Report)
                      .WithMany(r => r.Verifications)
                      .HasForeignKey(v => v.ReportId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(v => v.User)
                      .WithMany(u => u.Verifications)
                      .HasForeignKey(v => v.UserId)
                       .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // StatusHistory
            // -----------------------------------------------
            modelBuilder.Entity<StatusHistory>(entity =>
            {
                entity.HasOne(sh => sh.Report)
                      .WithMany(r => r.StatusHistories)
                      .HasForeignKey(sh => sh.ReportId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sh => sh.ChangedBy)
                      .WithMany(u => u.StatusHistories)
                      .HasForeignKey(sh => sh.ChangedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // Notifications
            // -----------------------------------------------
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasOne(n => n.User)
                      .WithMany(u => u.Notifications)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(n => n.Report)
                      .WithMany(r => r.Notifications)
                      .HasForeignKey(n => n.ReportId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // EmergencyEscalations: one-to-one with Report
            // -----------------------------------------------
            modelBuilder.Entity<EmergencyEscalation>(entity =>
            {
                entity.HasOne(e => e.Report)
                      .WithOne(r => r.EmergencyEscalation)
                      .HasForeignKey<EmergencyEscalation>(e => e.ReportId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.EscalatedBy)
                      .WithMany(u => u.EmergencyEscalations)
                      .HasForeignKey(e => e.EscalatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // -----------------------------------------------
            // RateLimits: one row per user per action type
            // -----------------------------------------------
            modelBuilder.Entity<RateLimit>(entity =>
            {
                entity.HasIndex(r => new { r.UserId, r.ActionType }).IsUnique();

                entity.HasOne(r => r.User)
                      .WithMany(u => u.RateLimits)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}

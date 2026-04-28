using Microsoft.EntityFrameworkCore;
using Rulesage.Retrieval.Database.Entities;

namespace Rulesage.Retrieval.Database;

public class DslDbContext(DbContextOptions<DslDbContext> options) : DbContext(options)
{
    public DbSet<DslEntry> DslEntries => Set<DslEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<DslEntry>(entity =>
        {
            entity.HasIndex(e => e.Embedding)
                .HasMethod("hnsw")
                .HasOperators("vector_cosine_ops")
                .HasAnnotation("Npgsql:IndexParameters", "m = 16, ef_construction = 64");
        });
    }
}
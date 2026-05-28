using System.Text.Json.Serialization;

namespace VVG.Web.Models
{
    /// <summary>
    /// Blog post categories. The JsonStringEnumConverter ensures the JSON
    /// serializer writes/reads the enum as a string (e.g., "Technology")
    /// rather than an integer (e.g., 2), which is more readable and
    /// resilient to reordering.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum Category
    {
        Article,
        Business,
        Technology,
        Marketing,
        Design,
        Productivity,
        Leadership,
        Strategy,
        Innovation
    }
}

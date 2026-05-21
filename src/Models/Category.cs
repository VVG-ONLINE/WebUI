using System.Text.Json.Serialization;

namespace VVG.Web.Models
{
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

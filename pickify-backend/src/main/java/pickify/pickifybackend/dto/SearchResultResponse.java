package pickify.pickifybackend.dto;

public record SearchResultResponse(
        String imageUrl,
        String title,
        String searchUrl
) {
}

package pickify.pickifybackend.dto;

import java.util.List;

public record PickyPhotoKeywordResponse(
        String langType,
        List<String> keywords
) {
}

package pickify.pickifybackend.dto;

import java.util.List;

public record PickyPhotoRequest(
        String imageUrl,
        String name,
        List<String> keywords,
        String userUuid
) {
}

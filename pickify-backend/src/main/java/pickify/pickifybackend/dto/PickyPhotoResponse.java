package pickify.pickifybackend.dto;

import java.util.List;

public record PickyPhotoResponse(
        String id,
        List<SearchResultResponse> data
) {
}
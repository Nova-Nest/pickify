package pickify.pickifybackend.dto;

import java.util.List;

public record TestResponse(
        String langType,
        List<String> keywords,
        List<String> queries
) {
}

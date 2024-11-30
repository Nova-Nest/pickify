package pickify.pickifyaibackend.example.util.controller.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class ReviewSummaryResponse {
    private String summary;
    private List<String> keywords;

    public ReviewSummaryResponse(String summary, List<String> keywords) {
        this.summary = summary;
        this.keywords = keywords;
    }
}

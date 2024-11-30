package pickify.pickifyaibackend.npl.controller.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class KeywordResponse {
    private List<String> keywords;

    public KeywordResponse(List<String> keywords) {
        this.keywords = keywords;
    }
}

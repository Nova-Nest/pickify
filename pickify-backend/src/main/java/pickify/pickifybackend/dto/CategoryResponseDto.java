package pickify.pickifybackend.dto;

import java.util.Map;

public class CategoryResponseDto {
    private String bestCategory;
    private Map<String, Integer> categoryScores;

    public CategoryResponseDto(String bestCategory, Map<String, Integer> categoryScores) {
        this.bestCategory = bestCategory;
        this.categoryScores = categoryScores;
    }

    public String getBestCategory() {
        return bestCategory;
    }

    public Map<String, Integer> getCategoryScores() {
        return categoryScores;
    }
}

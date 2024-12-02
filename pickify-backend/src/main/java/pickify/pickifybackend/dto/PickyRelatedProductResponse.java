package pickify.pickifybackend.dto;

import pickify.pickifybackend.entity.UserLog;

import java.util.List;

public record PickyRelatedProductResponse(
        String category,
        List<Data> data
) {
    public PickyRelatedProductResponse(String category, List<Data> data) {
        this.category = category;
        this.data = data;
    }

    public record Data(
            String imageUrl,
            String name,
            List<String> keywords
    ) {
        public Data(String imageUrl, String name, List<String> keywords) {
            this.imageUrl = imageUrl;
            this.name = name;
            this.keywords = keywords;
        }
    }
}
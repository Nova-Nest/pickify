package pickify.pickifybackend.entity;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Document(collection = "userLog")
public class UserLog {
    @Id
    private String id;
    private LocalDateTime createdAt;
    private String userUuid;
    private String mainKeyword;
    private List<String> builtInAiKeywords; //나영님이 주시는 Keywords
    private List<String> geminiReturnKeywords; //후가공 keywords
    private String category;
    private String originalImageUrl;
    private List<String> resultImageUrls;

    @Builder
    private UserLog(String userUuid, String mainKeyword, List<String> builtInAiKeywords, List<String> geminiReturnKeywords,
                    String category, String originalImageUrl, List<String> resultImageUrls) {
        this.createdAt = LocalDateTime.now();
        this.userUuid = userUuid;
        this.mainKeyword = mainKeyword;
        this.builtInAiKeywords = builtInAiKeywords;
        this.geminiReturnKeywords = geminiReturnKeywords;
        this.category = category;
        this.originalImageUrl = originalImageUrl;
        this.resultImageUrls = resultImageUrls;
    }
}

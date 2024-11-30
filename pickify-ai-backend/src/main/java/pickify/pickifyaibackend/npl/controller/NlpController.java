package pickify.pickifyaibackend.npl.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pickify.pickifyaibackend.npl.controller.dto.KeyWordRequest;
import pickify.pickifyaibackend.npl.controller.dto.KeywordResponse;
import pickify.pickifyaibackend.npl.util.EnglishKeywordExtractor;
import pickify.pickifyaibackend.npl.util.KoreanKeywordExtractor;

import java.io.IOException;
import java.util.List;

@RestController
public class NlpController {
    private final EnglishKeywordExtractor englishExtractor = new EnglishKeywordExtractor();
    private final KoreanKeywordExtractor koreanExtractor = new KoreanKeywordExtractor();

    @PostMapping("/extract_keywords")
    public KeywordResponse extractKeywords(@RequestBody KeyWordRequest request) throws IOException {
        List<String> keywords;

        if (request.getLanguage().equalsIgnoreCase("english")) {
            keywords = englishExtractor.extractNouns(request.getText());
        } else if (request.getLanguage().equalsIgnoreCase("korean")) {
            keywords = koreanExtractor.extractNouns(request.getText());
        } else {
            throw new IllegalArgumentException("지원되지 않는 언어입니다: " + request.getLanguage());
        }

        return new KeywordResponse(keywords);
    }
}

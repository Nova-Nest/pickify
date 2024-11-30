package pickify.pickifyaibackend.example.util.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pickify.pickifyaibackend.example.util.controller.dto.ReviewRequestDto;
import pickify.pickifyaibackend.example.util.controller.dto.ReviewSummaryResponse;
import pickify.pickifyaibackend.npl.util.EnglishKeywordExtractor;
import pickify.pickifyaibackend.example.util.KeywordExtractor;
import pickify.pickifyaibackend.npl.util.KoreanKeywordExtractor;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ReviewController {
    private final EnglishKeywordExtractor englishExtractor = new EnglishKeywordExtractor();
    private final KoreanKeywordExtractor koreanExtractor = new KoreanKeywordExtractor();

    @PostMapping("/summarize")
    public ReviewSummaryResponse summarizeReview(@RequestBody ReviewRequestDto request) {
        String reviewText = request.getText();

        // 텍스트 요약 및 키워드 추출 로직 호출
        String summaryText = simpleSummarize(reviewText);
        List<String> keywords = extractKeywords(reviewText);

        return new ReviewSummaryResponse(summaryText, keywords);
    }

    private String simpleSummarize(String text) {
        // 간단한 요약 (예: 처음 몇 문장 가져오기)
        String[] sentences = text.split("\\.");
        return sentences.length > 2 ? sentences[0] + "." + sentences[1] + "." : text;
    }

    private List<String> extractKeywords(String text) {
        // OpenNLP를 이용한 간단한 키워드 추출 (명사 추출 등)
        // 예시: 단어 길이가 3 이상인 단어들만 추출
        return Arrays.stream(text.split("\\s+"))
                .filter(word -> word.length() > 2)
                .distinct()
                .collect(Collectors.toList());
    }

    @PostMapping("/nlp-summarize")
    public List<String> aiExtractKeywords(String text) {
        KeywordExtractor extractor = new KeywordExtractor();
        return extractor.extractNouns(text);
    }

}


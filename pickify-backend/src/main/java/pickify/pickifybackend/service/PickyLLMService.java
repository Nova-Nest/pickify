package pickify.pickifybackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.gax.rpc.DataLossException;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.VertexAiGeminiChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import pickify.pickifybackend.dto.PickyPhotoRequest;
import pickify.pickifybackend.dto.PickyPhotoResponse;
import pickify.pickifybackend.dto.PickyRelatedProductResponse;
import pickify.pickifybackend.dto.SearchResultResponse;
import pickify.pickifybackend.entity.UserLog;
import pickify.pickifybackend.repository.UserLogRepository;
import pickify.pickifybackend.util.PickyPhotoProcessor;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class PickyLLMService {
    @Value("${gcp.vertex.projectId}")
    private String PROJECT_ID;
    @Value("${gcp.vertex.location}")
    private String LOCATION;

    private final String MODEL_NAME = "gemini-1.5-flash-001";

    @Value("${category.file.path}")
    private String CATEGORY_FILE_PATH;

    private final PickyPhotoProcessor pickyPhotoProcessor;
    private final UserLogRepository userLogRepository;

    private static List<String> categoryList = new ArrayList<>(); //파일에서 읽은 카테고리들을 저장

    public PickyPhotoResponse getAIResult(PickyPhotoRequest pickyPhotoRequest) {
        ChatLanguageModel model = VertexAiGeminiChatModel.builder()
                .project(PROJECT_ID)
                .location(LOCATION)
                .modelName(MODEL_NAME)
                .build();

            String category = extractCategory(pickyPhotoRequest.keywords(), model);
            List<String> results = extractDataResult(pickyPhotoRequest, model);

            List<SearchResultResponse> searchResultResponseList = pickyPhotoProcessor.searchImageBy(results);

            UserLog savedUserlog = getUserLog(pickyPhotoRequest, category, results, searchResultResponseList);
            return new PickyPhotoResponse(savedUserlog.getId(), searchResultResponseList);
    }

    public PickyRelatedProductResponse getRelatedProduct(String id) {
        UserLog userLog = userLogRepository.findById(id)
                .orElseThrow(() -> new NullPointerException("A datum does not exist : This is null"));

        String resultCategory = userLog.getCategory();
        String userUuid = userLog.getUserUuid();

        List<UserLog> relatedCategoryLogs = userLogRepository.findAllByCategoryAndUserUuidOrderByCreatedAtDesc(resultCategory, userUuid);

        Set<String> seenKeywords = new HashSet<>();
        List<UserLog> uniqueLogs = new ArrayList<>();

        for (UserLog log : relatedCategoryLogs) {
            String key = log.getMainKeyword() + ":" + String.join(",", log.getBuiltInAiKeywords());
            if (seenKeywords.add(key)) {
                uniqueLogs.add(log);
            }
        }

        List<PickyRelatedProductResponse.Data> data = uniqueLogs.stream()
                .map(log -> new PickyRelatedProductResponse.Data(log.getOriginalImageUrl(), log.getMainKeyword(), log.getBuiltInAiKeywords()))
                .limit(4)
                .toList();

        return new PickyRelatedProductResponse(userLog.getCategory(), data);
    }


    public List<SearchResultResponse> getSuggestion(String keywords, String productId) {
        ChatLanguageModel model = VertexAiGeminiChatModel.builder()
                .project(PROJECT_ID)
                .location(LOCATION)
                .modelName(MODEL_NAME)
                .build();

        UserLog userLog = userLogRepository.findById(productId)
                .orElseThrow(() -> new NullPointerException("A datum does not exist : This is null"));

        List<String> keywordList = Arrays.asList(keywords.split(","));
        List<String> extractQuery = extractSuggestionWith(userLog.getMainKeyword(), keywordList, model);

        return pickyPhotoProcessor.searchImageBy(extractQuery);
    }

    private List<String> extractDataResult(PickyPhotoRequest pickyPhotoRequest, ChatLanguageModel model) {
        ObjectMapper objectMapper = new ObjectMapper();

        UserMessage searchCandidates = PromptManager.extractSearchCandidates(pickyPhotoRequest.name(), pickyPhotoRequest.keywords());
        Response<AiMessage> result = model.generate(searchCandidates);

        List<String> results = new ArrayList<>();

        try {
            JsonNode jsonNode = objectMapper.readTree(result.content().text());
            if (jsonNode.isArray()) {
                for (JsonNode json : jsonNode) {
                    results.add(json.asText());
                }
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        return results;
    }

    private String extractCategory(List<String> keywords, ChatLanguageModel model) {
        loadCategoriesFromFile(CATEGORY_FILE_PATH);

        UserMessage category = PromptManager.extractCategoryFromKeywords(keywords, categoryList);
        Response<AiMessage> resultResponse = model.generate(category);

        return extractCategoryFromJson(resultResponse.content().text());
    }

    private List<String> extractSuggestionWith(String originalKeyword, List<String> keywords, ChatLanguageModel model) {
        ObjectMapper objectMapper = new ObjectMapper();

        UserMessage searchCandidates = PromptManager.extractSuggestionWith(originalKeyword, keywords);
        Response<AiMessage> resultResponse = model.generate(searchCandidates);

        List<String> results = new ArrayList<>();

        try {
            JsonNode jsonNode = objectMapper.readTree(resultResponse.content().text());
            if (jsonNode.isArray()) {
                for (JsonNode json : jsonNode) {
                    results.add(json.asText());
                }
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return results;
    }

    private UserLog getUserLog(PickyPhotoRequest pickyPhotoRequest, String category, List<String> results, List<SearchResultResponse> searchResultResponseList) {
        UserLog userLog = UserLog.builder()
                .userUuid(pickyPhotoRequest.userUuid())
                .mainKeyword(pickyPhotoRequest.name())
                .builtInAiKeywords(pickyPhotoRequest.keywords())
                .category(category)
                .geminiReturnKeywords(results)
                .originalImageUrl(pickyPhotoRequest.imageUrl())
                .resultImageUrls(searchResultResponseList.stream().map(SearchResultResponse::imageUrl).toList())
                .build();

        return userLogRepository.save(userLog);
    }

    private String extractCategoryFromJson(String jsonResponse) {
        Pattern pattern = Pattern.compile("\"category\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(jsonResponse);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    // 서버가 시작될 때 파일을 읽어 메모리에 저장하는 메서드
    private void loadCategoriesFromFile(String filePath) {
        ClassPathResource resource = new ClassPathResource(filePath);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // Split the line by ">"
                String[] parts = line.split(" > ");
                // Take the first part as the root category
                String rootCategory = parts[0].trim();
                // Add the root category to the list if it's not already present
                if (!categoryList.contains(rootCategory)) {
                    categoryList.add(rootCategory);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

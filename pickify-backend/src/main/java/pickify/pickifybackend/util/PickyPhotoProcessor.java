package pickify.pickifybackend.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pickify.pickifybackend.dto.SearchResultResponse;

import java.net.URI;
import java.util.List;

@Slf4j
@Component
public class PickyPhotoProcessor {
    @Value("${search-id}")
    private String SEARCH_ID;
    @Value("${gcp.api-key}")
    private String SEARCH_API_KEY;

    public List<SearchResultResponse> searchImageBy(List<String> queries) {
        return queries.stream().map(this::getSearchResponse).toList();
    }

    public SearchResultResponse searchImageBy(String query) {
        return getSearchResponse(query);
    }

    private SearchResultResponse getSearchResponse(String query) {
        RestTemplate restTemplate = new RestTemplate();

        String API_URL = "https://www.googleapis.com/customsearch/v1";
        String urlString = String.format(
                "%s?q=%s&searchType=image&key=%s&cx=%s",
                API_URL, query.replace(" ", "+"), SEARCH_API_KEY, SEARCH_ID
        );
        URI uri = URI.create(urlString);

        // API 요청 및 응답 수신
        String response = restTemplate.getForEntity(uri, String.class).getBody();
        ObjectMapper objectMapper = new ObjectMapper();

        try {
            // Response -> JSON
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.get("items");

            return getFirstResult(items);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON Parsing Error", e);
        }
    }

    private SearchResultResponse getFirstResult(JsonNode items) {
        if (items.isArray() && !items.isEmpty()) {
            JsonNode first = items.get(0);

            String imageUrl = first.path("link").asText();
            String imageTitle = first.path("title").asText();
            String contextLink = first.path("image").path("contextLink").asText();

            return new SearchResultResponse(imageUrl, imageTitle, contextLink);
        } else {
            log.warn("No image found for query, 검색어에서 검색결과를 찾을 수 없습니다");
            throw new RuntimeException("Search Can't find any result");
        }
    }
}

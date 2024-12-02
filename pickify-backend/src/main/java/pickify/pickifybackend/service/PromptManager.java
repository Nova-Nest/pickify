package pickify.pickifybackend.service;

import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;

import java.util.List;

public class PromptManager {
    public static UserMessage extractSearchCandidates(String name, List<String> keywords) {
        return UserMessage.from(
                TextContent.from("""
                        Generate meaningful search strings based on the given `name` and `keywords`. 
                        These search strings should describe items, styles, or concepts closely related to the `name` and keywords in a natural and relevant way.

                        **Rules:**
                        1. Results must not be simple keyword combinations. Instead, they should reflect meaningful phrases or ideas that combine the `name` with the essence of the keywords.
                        2. Provide at least five results.
                        3. Results should be relevant to the `name` and keywords and must follow a structured format.
                        4. Output should be in a JSON-like list format.
                        5. Never include backticks in JSON. Don't do. like ```json```

                        **Input Examples:**
                        name: coffee
                        keywords: [cafe, starbucks, tea, green tea, latte, bread, donut]

                        **Output Example:**
                        [
                            "Starbucks latte pairing ideas",
                            "Top cafes for green tea lovers",
                            "How to bake bread for coffee mornings",
                            "Donut and coffee recipe ideas",
                            "Popular coffee shop vibes"
                        ]

                        **Input:**
                        name: %s
                        keywords: %s

                        **Output:** (provide JSON-like list format as shown above)
                        """.formatted(name, keywords))
        );
    }

    public static UserMessage extractKeywordFromPhoto(String photoUrl, String langType) {
        return UserMessage.from(
                ImageContent.from(photoUrl),
                TextContent.from(String.format("""
                        You can extract some keywords with the pictures. Your response should be in %s.
                        Keyword should be related to the picture, but avoid direct repetition.
                        Provide up to 10 related keywords, emphasizing context and variations.
                                            
                        For example:
                        - If input is "macbook", your keywords could include "laptop", "macbook pro", "keyboard", "thin laptop".
                                            
                        Format:
                        {
                            "langType": "%s",
                            "keywords": ["keyword1", "keyword2", ...]
                        }
                        """, langType, langType)
                )
        );
    }

    public static UserMessage extractAndGenerateQueries(String photoUrl, String langType) {
        return UserMessage.from(
                ImageContent.from(photoUrl),
                TextContent.from(String.format("""
                        Analyze the provided image and generate relevant keywords.
                        Then, create 5 unique and meaningful search queries based on the keywords that could help find similar or related products.
                                            
                        Example:
                        If the input is a photo of "macbook":
                        - Keywords: ["laptop", "thin laptop", "apple macbook", "ultrabook"]
                        - Queries: ["best thin laptop", "cheap ultrabook", "alternatives to macbook", "top apple laptops", "buy macbook online"]

                        Your response should include:
                        1. Extracted keywords (up to 10, JSON array).
                        2. Generated search queries (5, JSON array).

                        Json Format never include MD grammars Just pure JSON Format:
                                            
                        {
                            "langType": "%s",
                            "keywords": ["keyword1", "keyword2", ...],
                            "queries": ["query1", "query2", ...]
                        }
                        """, langType)
                )
        );
    }

    public static UserMessage extractImagesWithKeywords(String photoUrl, List<String> keywords) {
        return UserMessage.from(
                ImageContent.from(photoUrl),
                TextContent.from(String.format("""
                        Perform a Google image search using the provided photo as context and the following keywords: %s.
                        Identify the first relevant image based on your search.

                        Your response must strictly follow this JSON format:
                                            
                        {
                            "relatedUrl": ["actual_image_url"]
                        }

                        Ensure that "actual_image_url" is a direct link to the image file (e.g., ending with .jpg, .png, or .gif) and not a Google search result URL.
                        Do not include any other details in the response.
                        """, keywords)
                )
        );
    }

    public static UserMessage extractSuggestionWith(String originalKeyword, List<String> keywords) {
        return UserMessage.from(
                TextContent.from(String.format("""
                    You are a famous fashionista.
                    For the given `originalKeyword` and `keywords`, suggest product ideas.
                    Each suggestion should match the `originalKeyword` with one of the `keywords` independently.
                    The result must be a JSON array where each item corresponds to one keyword.

                    Example Input:
                    originalKeyword: "knit"
                    keywords: ["jeans", "boots", "skirts"]

                    Example Output:
                    [
                        "Pair knit sweaters with jeans for a relaxed winter look",
                        "Combine knit sweaters with boots for a cozy fall outfit",
                        "Style knit cardigans with skirts for a chic spring vibe"
                    ]

                    **Input:**
                    originalKeyword: %s
                    keywords: %s

                    **Output:** (JSON array format as shown above)
                    """, originalKeyword, keywords))
        );
    }

    // AI에게 카테고리를 기반으로 가장 관련 있는 카테고리를 찾도록 요청하는 메서드
    public static UserMessage extractCategoryFromKeywords(List<String> keywords, List<String> categoryList) {
        String categories = String.join(",", categoryList);

        // 키워드를 문자열로 변환
        String keywordString = String.join(",", keywords);

        // AI에게 프롬프트 전달
        return UserMessage.from(
                TextContent.from(String.format("""
                    Extract the most relevant category from the provided keywords: %s.
                    
                    Here are the available categories:
                    %s

                    Your response must strictly follow this JSON format:

                    {
                        "category": "root_category_name"
                    }

                    Replace "root_category_name" with the most relevant category for the provided keywords.
                    """, keywordString, categories)
                )
        );

    }
}

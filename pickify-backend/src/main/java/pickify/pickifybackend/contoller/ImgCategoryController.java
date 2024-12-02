package pickify.pickifybackend.contoller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pickify.pickifybackend.dto.CategoryRequestDto;
import pickify.pickifybackend.service.ImgCategoryService;

@RestController
@RequiredArgsConstructor
public class ImgCategoryController {

    private final ImgCategoryService imgCategoryService;

    @PostMapping("/api/img-category")
    public String matchKeywordForCategory(@RequestBody CategoryRequestDto requestDto) {
        return imgCategoryService.getAIResult(requestDto.getKeywords());
    }
}

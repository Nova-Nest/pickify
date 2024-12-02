package pickify.pickifybackend.contoller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pickify.pickifybackend.service.ResourceService;

import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping("/upload")
    public String upload(@RequestBody MultipartFile file) {
        return resourceService.uploadFile(file);
    }

    @GetMapping("/signedUrl")
    public Map<String, URL> getSignedUrl(String contentType, int minutes) {
        URL signedUrl = resourceService.getSignedUrl(contentType, minutes);
        Map<String, URL> response = new HashMap<>();
        response.put("signedUrl", signedUrl);
        return response;
    }
}

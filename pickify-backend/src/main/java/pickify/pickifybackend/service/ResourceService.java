package pickify.pickifybackend.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResourceService {

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    private final Storage storage;

    public String uploadFile(MultipartFile file) {

        String uuid = UUID.randomUUID().toString(); // Google Cloud Storage에 저장될 파일 이름
        String contentType = file.getContentType(); // 파일의 형식 ex) JPG
        String extension = getExtension(file.getOriginalFilename()); // 확장자 추출
        String fileName = LocalDate.now() + "/" + uuid + extension; // 날짜 기반 디렉토리 구조 포함
        // Cloud에 이미지 업로드
        try {
            BlobId blobId = BlobId.of(bucketName, fileName);

            // BlobInfo 생성 (파일 정보)
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType) // 파일 형식 설정
                    .build();

            storage.create(blobInfo, file.getInputStream());

            return blobInfo.getMediaLink();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return ""; // 확장자가 없는 경우 빈 문자열 반환
    }

    public URL getSignedUrl(String contentType, int minutes) {
        log.info("get signed url");
        String uuid = UUID.randomUUID().toString(); // Google Cloud Storage에 저장될 파일 이름

        String fileName = LocalDate.now() + "/" + uuid + ".png"; // 날짜 기반 디렉토리 구조 포함

        log.info("fileName : {}", fileName);

        BlobId blobId = BlobId.of(bucketName, fileName);

        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();


        // Generate Signed URL
        Map<String, String> extensionHeaders = new HashMap<>();
        extensionHeaders.put("Content-Type", contentType);

        URL url =
                storage.signUrl(
                        blobInfo,
                        minutes,
                        TimeUnit.MINUTES,
                        Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                        Storage.SignUrlOption.withExtHeaders(extensionHeaders),
                        Storage.SignUrlOption.withV4Signature());

        return url;
    }
}
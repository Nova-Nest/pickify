package pickify.pickifybackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    private final long MAX_AGE_SECS = 3600;


    private final LoggingInterceptor loggingInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 모든 경로에 대해 인터셉터 적용
        registry.addInterceptor(loggingInterceptor).addPathPatterns("/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
//                .allowedOriginPatterns("*")
                .allowedOrigins(
                        "http://localhost:3000",
                        "chrome-extension://joefpbhghckcofhmbofcopcclpgndaif",
                        "chrome-extension://adbeiiapbemgdpeobhmdhaemefpnafme",
                        "chrome-extension://lnfglnoigklliplnmljoaolgepocmomn",
                        "chrome-extension://ejajjefkhngndnmedbeidelfmciigldc",
                        "chrome-extension://iohmklbhlmidbfmacicpgdlecmbgmnpg",
                        "chrome-extension://ifbfagdhnodepmlnegjfhfpenmmmhbfg"
                )
                // GET, POST, PATCH, DELETE, OPTIONS 메서드 허용
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(MAX_AGE_SECS);
    }
}
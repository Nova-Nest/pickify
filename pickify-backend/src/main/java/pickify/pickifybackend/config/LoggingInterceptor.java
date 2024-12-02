package pickify.pickifybackend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

@Component
public class LoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);

    // 요청이 컨트롤러에 도달하기 전에 실행

    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        logger.info("Incoming request: [{} {}] at [{}]",
                request.getMethod(),
                request.getRequestURI(),
                LocalDateTime.now());

        String queryString = request.getQueryString();
        if (queryString != null) {
            logger.info("Query parameters: [{}]", queryString);
        }

        return true; // `true`를 반환하면 요청이 다음 단계로 진행됩니다.
    }

    // 요청 처리 후, 응답이 클라이언트로 보내지기 전에 실행
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        logger.info("Response status: [{}] for request [{} {}]",
                response.getStatus(),
                request.getMethod(),
                request.getRequestURI());
    }
}

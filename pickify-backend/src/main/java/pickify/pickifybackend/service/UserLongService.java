package pickify.pickifybackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pickify.pickifybackend.entity.UserLog;
import pickify.pickifybackend.repository.UserLogRepository;

@Service
@RequiredArgsConstructor
public class UserLongService {

    private final UserLogRepository userLongRepository;
    public void saveUserLog(UserLog userLog) {
        userLongRepository.save(userLog);
    }
}

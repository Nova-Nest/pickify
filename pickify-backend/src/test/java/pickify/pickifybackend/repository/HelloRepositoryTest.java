package pickify.pickifybackend.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import pickify.pickifybackend.domain.Hello;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
//@ActiveProfiles("dev")
class HelloRepositoryTest {

    @Autowired
    HelloRepository helloRepository;

    @Test
    @DisplayName("sample test")
    void sampleTest() {
        // given
        Hello hello = new Hello();

        // when
        Hello savedHello = helloRepository.save(hello);

        // then
        assertThat(savedHello).isNotNull();
    }

}
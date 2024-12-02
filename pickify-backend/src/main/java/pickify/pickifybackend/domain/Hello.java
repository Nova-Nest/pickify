package pickify.pickifybackend.domain;

import lombok.Getter;
import org.springframework.data.annotation.Id;

@Getter
public class Hello {

    @Id
    public String id;
}

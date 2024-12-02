package pickify.pickifybackend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import pickify.pickifybackend.domain.Hello;

public interface HelloRepository extends MongoRepository<Hello, String> {

}

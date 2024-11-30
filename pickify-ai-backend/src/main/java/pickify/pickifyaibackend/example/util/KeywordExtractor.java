package pickify.pickifyaibackend.example.util;

import opennlp.tools.postag.POSModel;
import opennlp.tools.postag.POSTaggerME;
import opennlp.tools.tokenize.SimpleTokenizer;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class KeywordExtractor {
    public List<String> extractNouns(String text) {
        List<String> nouns = new ArrayList<>();

        try (InputStream modelIn = new FileInputStream("path/to/ko-pos.bin")) {
            // 모델 로드
            POSModel model = new POSModel(modelIn);
            POSTaggerME tagger = new POSTaggerME(model);

            // 토큰화
            String[] tokens = SimpleTokenizer.INSTANCE.tokenize(text);
            String[] tags = tagger.tag(tokens);

            // 명사 태그 필터링
            for (int i = 0; i < tokens.length; i++) {
                if (tags[i].startsWith("NN")) { // 영어 명사일 경우 "NN"으로 시작
                    nouns.add(tokens[i]);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return nouns;
    }
}

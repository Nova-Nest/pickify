package pickify.pickifyaibackend.npl.util;

import opennlp.tools.postag.POSModel;
import opennlp.tools.postag.POSTaggerME;
import opennlp.tools.tokenize.SimpleTokenizer;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class EnglishKeywordExtractor {

    public List<String> extractNouns(String text) throws IOException {
        List<String> nouns = new ArrayList<>();

        // 리소스 폴더에서 en-pos-maxent.bin 모델 파일을 읽어들임
        try (InputStream modelIn = getClass().getResourceAsStream("/en-pos-maxent.bin")) {
            if (modelIn == null) {
                throw new FileNotFoundException("POS model file not found in resources.");
            }

            // 모델 로딩
            POSModel model = new POSModel(modelIn);
            POSTaggerME tagger = new POSTaggerME(model);

            // SimpleTokenizer로 텍스트를 토큰화 (구두점도 처리)
            SimpleTokenizer tokenizer = SimpleTokenizer.INSTANCE;
            String[] tokens = tokenizer.tokenize(text);

            // 태그를 추출하고 명사 추출
            String[] tags = tagger.tag(tokens);
            for (int i = 0; i < tokens.length; i++) {
                // NN, NNS, NNP, NNPS와 같은 명사 관련 태그를 처리
                if (tags[i].startsWith("NOUN")) {
                    nouns.add(tokens[i]);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
            throw new IOException("Error reading the POS model file.");
        }

        return nouns;
    }
}

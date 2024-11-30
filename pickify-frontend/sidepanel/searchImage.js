import { dataUrlToGenerativePart, model } from './utils/aiModal.js';
import { getData } from './utils/getData.js';
import { postData } from './utils/postData.js';
import { getFromStorage, setToStorage } from './utils/storage.js';

export async function getSearchedImage(croppedDataUrl) {
  goUpSearchResultAndSkeleton();
  const { imageInfo } = await getWordAndKeyword(croppedDataUrl);
  const { uploadedImageUrl } = await uploadCapturedImage(croppedDataUrl);
  const { userUuid } = await getUserUuid();

  if (imageInfo && uploadedImageUrl && userUuid) {
    getSearchedImageListAndDisplay({ imageUrl: uploadedImageUrl, userUuid, ...imageInfo });
  }
}

function goUpSearchResultAndSkeleton() {
  // 검색결과 흰색 영역 보이기
  const searchResult = document.querySelector('.searchResult');
  searchResult.style.transform = 'translate(0, 0)';

  // selectedTab 초기화
  const searchImgButton = document.querySelector('#searchImgButton');
  const recommendCombinationButton = document.querySelector('#recommendCombinationButton');
  searchImgButton.className = 'selectedTab';
  recommendCombinationButton.className = '';

  // 스켈레톤 보이기
  const searchedImageList = document.querySelector('.searchedImageList');
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      const skeleton = document.createElement('li');
      skeleton.classList.add('skeleton-image');
      setTimeout(() => {
        searchedImageList.appendChild(skeleton);
      }, 100 * i);
    }
  }, 600);
}

// 2-3. 이미지의 signedUrl을 만들고 백엔드에 업로드하는 함수
async function uploadCapturedImage(dataUrl) {
  // Base64 이미지를 Blob으로 변환
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('이미지 변환 실패');
  const blob = await response.blob();

  try {
    // 백엔드에서 Signed URL 받아오기
    const { signedUrl } = await getData(`/signedUrl?contentType=${blob.type}&minutes=10`);

    // Signed URL로 이미지 업로드
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type,
      },
    });

    if (uploadResponse.ok) {
      console.log('이미지 업로드 성공!');
      return { uploadedImageUrl: signedUrl };
    } else {
      throw new Error('이미지 업로드 실패');
    }
  } catch (error) {
    console.error('업로드 과정 중 오류:', error);
    caption.textContent = `${timestamp} (업로드 실패: ${error.message})`;
  }
}

// 2-4. 제미나이에게 단어와 키워드 추출하는 함수
async function getWordAndKeyword(dataUrl) {
  try {
    const prompt =
      "Returns just an JSON object with the value of 'name' being what is in the image and the value of 'keywords' being an array containing 5 noun words that are keywords related to it.";
    const imagePart = await dataUrlToGenerativePart(dataUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const rawText = response.text();
    // const cleanText = rawText.replace(/```json|```/g, '').trim();
    const match = rawText.match(/```json([\s\S]*?)```/);
    const cleanText = match[1].trim();
    const imageInfo = JSON.parse(cleanText);
    return { imageInfo };
  } catch (error) {
    console.error('이미지 분석 실패', error);
  }
}

//  2-5. 스토리지 userUuid 저장해서 같이 보내는 함수
async function getUserUuid() {
  try {
    let userUuid = await getFromStorage('userUuid');

    if (!userUuid) {
      // UUID가 없을 경우 생성 및 저장
      const generateUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      userUuid = generateUUID();

      await setToStorage('userUuid', userUuid);
      console.log('새로운 userUuid가 생성되었습니다:', userUuid);
    } else {
      console.log('기존 userUuid를 반환합니다:', userUuid);
    }

    return { userUuid };
  } catch (error) {
    console.error('UUID 처리 중 오류 발생:', error);
    throw error;
  }
}

// 2-6. 위의 이미지 정보를 백엔드에 보내서 데이터를 받아 패널에 그리는 함수
async function getSearchedImageListAndDisplay(imageData) {
  const result = await postData('/picky/extract', imageData);

  setToStorage('nowCaptureId', result.id);
  const searchedImageList = document.querySelector('.searchedImageList');
  searchedImageList.innerHTML = '';

  result.data.forEach((oneItem, index) => {
    const item = document.createElement('li');
    item.role = 'button';
    const img = document.createElement('img');
    img.src = oneItem.imageUrl;
    img.alt = `${oneItem.title}`;
    const a = document.createElement('a');
    a.className = 'itemInfo';
    a.target = '_blank';
    a.href = oneItem.searchUrl;
    const h3 = document.createElement('h3');
    h3.innerText = oneItem.title;

    a.appendChild(h3);
    item.appendChild(img);
    item.appendChild(a);
    searchedImageList.appendChild(item);
  });
}

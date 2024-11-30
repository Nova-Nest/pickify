import { dataUrlToGenerativePart, model } from './utils/aiModal';
import { getData } from './utils/getData';
import { getFromStorage } from './utils/storage';

export async function getRecommendCombination() {
  const { nameList } = await getLastSearchedImg();
  const { threeItemInfoFromAI } = await getRecommendFromGemini(nameList);
  const { threeItemLinks } = await getSearchedThreeItemList(threeItemInfoFromAI?.name);
  dispalyRecommendText(threeItemInfoFromAI, threeItemLinks);
}

// 1. 백엔드 내 검색이력 요청
// 1-1. 이런 걸 검색하셨군요 어울리는거 추천해줄게요
async function getLastSearchedImg() {
  const nowCaptureId = await getFromStorage('nowCaptureId');
  const lastSearchedImgList = await getData(`/picky/relateProduct?id=${nowCaptureId}`);
  const nameList = lastSearchedImgList.data.map((item) => item.name);
  let firstText = formatArrayWithAnd(nameList);
  if (nameList.length > 1) {
    firstText += `<br/><br/>I will recommend products that match <strong>${lastSearchedImgList.category}</strong>!`;
  }

  const relatedCombinationList = document.querySelector('.relatedCombinationList');
  setTimeout(() => {
    // 첫번쨰 스켈레톤 보이기
    for (let i = 0; i < 2; i++) {
      const skeleton = document.createElement('div');
      if (i == 0) {
        skeleton.style.marginTop = '1em';
      }
      skeleton.classList.add('skeleton-text');
      relatedCombinationList.appendChild(skeleton);
    }
    const skeleton = document.createElement('div');
    skeleton.classList.add('skeleton-text', 'short');
    relatedCombinationList.appendChild(skeleton);
    // 첫번째 단락 그리기
    setTimeout(() => {
      relatedCombinationList.innerHTML = '';
      const p1 = document.createElement('p');
      p1.innerHTML = firstText;
      relatedCombinationList.appendChild(p1);
    }, 600);

    // 두번째 단락 스캘레톤 그리기
    setTimeout(() => {
      const skeletonH = document.createElement('h2');
      skeletonH.classList.add('skeleton-text', 'second-skeleton');
      skeletonH.style.height = '23.5px';
      const skeleton = document.createElement('div');
      skeleton.role = 'button';
      skeleton.classList.add('skeleton-image', 'second-skeleton');
      skeleton.style.marginTop = '12px';
      relatedCombinationList.appendChild(skeletonH);
      relatedCombinationList.appendChild(skeleton);
    }, 700);
  }, 400);

  return { nameList };
}
// 2. 검색이력 name값 받아서 -> 빌트인한테 어울리는 상품 3개 추천받기
// 2-1.  (로딩중)
async function getRecommendFromGemini(nameList) {
  try {
    const prompt = `Provide a single JSON object containing three components:
    A key named name with a value as an array of three product names that go well with '${nameList?.join(
      ', '
    )} and this image'.
A key named text with a value as an array of three strings, where each string explains why the corresponding product in the name array complements this.
A key named finalText with a value as a concluding sentence recommending these products and closing the response.
`;
    const { dataUrl } = await getFromStorage('capturedImage');
    const imagePart = await dataUrlToGenerativePart(dataUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const rawText = response.text();
    const match = rawText.match(/```json([\s\S]*?)```/);
    const cleanText = match[1].trim();
    const threeItemInfoFromAI = JSON.parse(cleanText);
    console.log(threeItemInfoFromAI, 'threeItemInfoFromAI');
    return { threeItemInfoFromAI };
  } catch (error) {
    console.error('이미지랑 무언가 추천 실패', error);
  }
}

// 3. 백엔드 상품3개 각각의 검색결과 1개씩 요청해서 받기
async function getSearchedThreeItemList(threeItemNameList) {
  const nowCaptureId = await getFromStorage('nowCaptureId');
  const threeItemLinks = await getData(
    `/picky/picky-suggestion?keywords=${threeItemNameList.join(',')}&productId=${nowCaptureId}`
  );
  return { threeItemLinks };
}

// 4. 00 이미지 ~~이래서 추천해요.
function dispalyRecommendText(threeItemInfoFromAI, threeItemLinks) {
  const relatedCombinationList = document.querySelector('.relatedCombinationList');

  // 두번째 스켈레톤 빼기
  const skeletons = document.querySelectorAll('.second-skeleton');
  skeletons.forEach((ele) => {
    relatedCombinationList.removeChild(ele);
  });

  const secondBox = document.createElement('div');
  relatedCombinationList.appendChild(secondBox);

  const pOfThreeItems = threeItemLinks.map((oneItem, index) => {
    const pForOneItem = document.createElement('p');
    pForOneItem.className = 'recommendItem';

    const h2 = document.createElement('h2');
    h2.innerHTML = `${index + 1}. ` + threeItemInfoFromAI.name[index];
    const reasonText = document.createElement('div');
    reasonText.className = 'reasonText';
    reasonText.innerHTML = threeItemInfoFromAI.text[index];

    // 이미지 링크
    const item = document.createElement('div');
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

    pForOneItem.appendChild(h2);
    pForOneItem.appendChild(item);
    pForOneItem.appendChild(reasonText);

    return pForOneItem;
  });
  const finalText = document.createElement('p');
  finalText.className = 'finalText';
  finalText.innerHTML = threeItemInfoFromAI.finalText;

  // 3개 검색결과 하나씩 넣기
  pOfThreeItems.forEach((element, index) => {
    setTimeout(() => {
      secondBox.appendChild(element);
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }, 800 * index);
  });
  // 마지막문단
  setTimeout(() => {
    secondBox.appendChild(finalText);
    setTimeout(() => {
      finalText.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 300);
  }, 2000);
}

// -----------기타함수
function formatArrayWithAnd(arr) {
  if (arr.length === 1)
    return `You searched for <strong>${arr[0]}</strong>.<br/>
  So how about the products below that go well with this?`;
  if (arr.length === 2)
    return `You searched for <strong>${arr[0]}</strong>.<br/>
  You also searched for ${arr[1]} previously.`;
  if (arr.length === 3)
    return `You searched for <strong>${arr[0]}</strong>.<br/>You also searched for ${arr[1]} and ${arr[2]} previously.`;

  // Handle 3 or more elements
  const elementsToFormat = arr.slice(1);
  const lastElement = elementsToFormat.pop();
  return `You searched for <strong>${
    arr[0]
  }</strong>.<br/>You also searched for ${elementsToFormat.join(
    ', '
  )} and ${lastElement} previously.`;
}

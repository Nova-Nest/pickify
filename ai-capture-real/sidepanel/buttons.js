import { dummy } from './dummyData';
import { getData } from './utils/getData';
import { getFromStorage } from './utils/storage';

const clickTab = (event) => {
  const id = event.target.id;
  const nowSelectedTab = document.querySelector(`#${id}`);
  const prevSelectedTab = document.querySelector(`.selectedTab`);
  const relatedCombinationList = document.querySelector('.relatedCombinationList');
  const searchResultBox = document.querySelector('.innerContent');

  if (prevSelectedTab == nowSelectedTab) return;
  nowSelectedTab.className = 'selectedTab';
  prevSelectedTab.className = '';

  if (id == 'searchImgButton') {
    searchResultBox.style.transform = 'translate(0, 0)';
  }
  if (id == 'recommendCombinationButton') {
    searchResultBox.style.transform = 'translate(-100%, 0)';
    console.log(relatedCombinationList.childElementCount, 'childElementCount');
    if (!relatedCombinationList.childElementCount) {
      const p1 = document.createElement('p');
      p1.innerText = `
You searched for 00.
You have previously searched for products like 00, 00 and 00.`;
      relatedCombinationList.appendChild(p1);
    }
    // 조합에 해당하는 함수 부르기!
    // 1. 백엔드 내 검색이력 요청
    // 1-1. 이런 걸 검색하셨군요
    // 2. 검색이력 name값 받아서 -> 빌트인한테 어울리는 상품 3개 추천받기
    // 2-1. 어울리는거 추천해줄게요  (검색중 회색 글씨 스캘레톤)
    // 3. 백엔드 상품3개 각각의 검색결과 1개씩 요청해서 받기
    // 3-1. 00 이미지 ~~이래서 추천해요.
  }
};

async function getLastSearchedImg() {
  const id = getFromStorage('nowCaptureId');
  // const lastSearchedImgList = getData(`/picky/relateProduct?id=${id}`);
  const lastSearchedImgList = dummy;
  const nameList = lastSearchedImgList.data.map((item) => item.name);
}

function formatArrayWithAnd(arr) {
  if (arr.length === 1)
    return `You searched for ${arr[0]}.
  So how about the products below that go well with this?`;
  if (arr.length === 2)
    return `You searched for ${arr[0]}. 
  You also searched for ${arr[1]} previously.`;
  if (arr.length === 3)
    return `You searched for ${arr[0]}. 
  You also searched for ${arr[1]} and ${arr[2]} previously.`;

  // Handle 3 or more elements
  const lastElement = arr.pop(); // Extract the last element
  return `You searched for ${arr[0]}. 
  You also searched for ${arr[1]} and ${arr[2]} previously.`;
  return `${arr.join(', ')}, and ${lastElement}`;
}

// Example usage
const texts = ['1', '2', '3'];
console.log(formatArrayWithAnd(texts)); // Output: "1, 2, and 3"

document.getElementById('searchImgButton').addEventListener('click', clickTab);
document.getElementById('recommendCombinationButton').addEventListener('click', clickTab);

const clickTab = (event) => {
  const id = event.target.id;
  const nowSelectedTab = document.querySelector(`#${id}`);
  const prevSelectedTab = document.querySelector(`.selectedTab`);
  if (prevSelectedTab == nowSelectedTab) return;
  nowSelectedTab.className = "selectedTab";
  prevSelectedTab.className = "";
  if (id == "relatedImgButton") {
  }
  if (id == "recommendCombinationButton") {
    // 조합에 해당하는 함수 부르기!
    // 1. 백엔드 내 검색이력 요청
    // 1-1. 이런 걸 검색하셨군요
    // 2. 검색이력 name값 받아서 -> 빌트인한테 어울리는 상품 3개 추천받기
    // 2-1. 어울리는거 추천해줄게요  (검색중 회색 글씨 스캘레톤)
    // 3. 백엔드 상품3개 각각의 검색결과 1개씩 요청해서 받기
    // 3-1. 00 이미지 ~~이래서 추천해요.
  }
};

document.getElementById("relatedImgButton").addEventListener("click", clickTab);
document
  .getElementById("recommendCombinationButton")
  .addEventListener("click", clickTab);

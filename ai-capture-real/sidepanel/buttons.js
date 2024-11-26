const clickTab = (event) => {
  const id = event.target.id;
  const nowSelectedTab = document.querySelector(`#${id}`);
  const prevSelectedTab = document.querySelector(`.selectedTab`);
  if (prevSelectedTab == nowSelectedTab) return;
  nowSelectedTab.className = "selectedTab";
  prevSelectedTab.className = "";
  if (id == "recommendCombinationButton") {
    // 여기에 분석하기 에 해당하는 함수 부르기!
  }
};

document.getElementById("relatedImgButton").addEventListener("click", clickTab);
document
  .getElementById("recommendCombinationButton")
  .addEventListener("click", clickTab);

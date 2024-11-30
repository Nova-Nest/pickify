import { getRecommendCombination } from './recommendCombination';

const clickTab = async (event) => {
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

    if (!relatedCombinationList.childElementCount) {
      getRecommendCombination();
    }
  }
};

document.getElementById('searchImgButton').addEventListener('click', clickTab);
document.getElementById('recommendCombinationButton').addEventListener('click', clickTab);
